<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import InputSearch from "../components/InputSearch.vue";
import OrderCard from "../components/OrderCard.vue";

import { useRouter } from "vue-router";
import { ref, computed, onMounted } from 'vue';
import OrderService from "../services/order.service";
import ProductService from "../services/product.service";
import { push } from "notivue";

const router = useRouter();
const orderService = new OrderService();
const productService = new ProductService();
const role = computed(() => localStorage.getItem("role"));
const staff_id = computed(() => localStorage.getItem("id"));

const orders = ref([]);
const searchText = ref("");
const filteredStatus = ref("");
const filteredStatusText = ref("");

const fetchOrders = async () => {
    try {
        const response = await orderService.getAllOrders();
        orders.value = response;
    } catch (error) {
        console.error(error);
    }
};

const handleFilterStatus = (status) => {
    filteredStatus.value = status;
    switch (status) {
        case "pending":
            filteredStatusText.value = "Chờ xác nhận";
            break;
        case "confirmed":
            filteredStatusText.value = "Đã xác nhận";
            break;
        case "shipping":
            filteredStatusText.value = "Đang giao hàng";
            break;
        case "delivered":
            filteredStatusText.value = "Đã giao hàng";
            break;
        case "cancelled":
            filteredStatusText.value = "Đã hủy";
            break;
        default:
            filteredStatusText.value = "Tất cả đơn hàng";
            break;
    }
};

const filteredOrders = computed(() => {
    let result = orders.value;

    if (filteredStatus.value) {
        result = result.filter(order => order.status === filteredStatus.value);
    }

    if (searchText.value) {
        const keyword = searchText.value.toLowerCase();
        result = result.filter(order => {
            const searchableText = [
                order.product_id?.title, 
                order.user_id?.first_name, 
                order.user_id?.last_name, 
                order.shipping_address,
                order.phone_number
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(keyword);
        });
    }

    return result;
});

const handleApproveAllPending = async () => {
    try {
        const pendingOrders = orders.value.filter(order => order.status === "pending");
        if (pendingOrders.length === 0) {
            push.info("Không có đơn hàng nào đang chờ xác nhận");
            return;
        }
        
        if (confirm(`Xác nhận duyệt nhanh ${pendingOrders.length} đơn hàng?`)) {
            for (const order of pendingOrders) {
                await orderService.updateOrder(order._id, { 
                    status: "confirmed", 
                    staff_id: staff_id.value 
                });
                if (order.product_id?.quantity > 0) {
                    await productService.updateProduct(order.product_id?._id, { 
                        quantity: order.product_id.quantity - 1 
                    });
                }
            }
            push.success(`Đã xác nhận ${pendingOrders.length} đơn hàng`);
            fetchOrders();
        }
    } catch (error) {
        console.error(error);
        push.error("Lỗi khi duyệt hàng loạt");
    }
};

onMounted(async () => {
    if (role.value !== "staff") {
        router.push("/");
    }
    fetchOrders();
});
</script>

<template>
    <div class="flex flex-col min-h-screen overflow-hidden bg-gray-50">
        <Header></Header>
        <div class="flex-grow mx-8 sm:mx-16 lg:mx-24 my-8">
            <div class="flex flex-col gap-6">
                <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h1 class="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
                    
                    <div class="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
                        <div class="tooltip" data-tip="Tìm theo sản phẩm, khách hàng, địa chỉ, SĐT">
                            <InputSearch class="w-64" v-model=" searchText "></InputSearch>
                        </div>
                        
                        <div class="dropdown dropdown-end">
                            <div tabindex="0" role="button" class="btn btn-outline border-gray-300">
                                <span class="text-gray-600">{{ filteredStatusText || "Tất cả đơn hàng" }}</span>
                            </div>
                            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-lg border border-gray-100">
                                <li><a @click="handleFilterStatus( '' )">Tất cả đơn hàng</a></li>
                                <li><a @click="handleFilterStatus( 'pending' )">Chờ xác nhận</a></li>
                                <li><a @click="handleFilterStatus( 'confirmed' )">Đã xác nhận</a></li>
                                <li><a @click="handleFilterStatus( 'shipping' )">Đang giao hàng</a></li>
                                <li><a @click="handleFilterStatus( 'delivered' )">Đã giao hàng</a></li>
                                <li><a @click="handleFilterStatus( 'cancelled' )">Đã hủy</a></li>
                            </ul>
                        </div>

                        <button class="btn btn-primary shadow-md" @click=" handleApproveAllPending ">
                            Duyệt nhanh (Pending)
                        </button>
                    </div>
                </div>

                <template v-if=" filteredOrders.length > 0 ">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        <OrderCard v-for=" order in filteredOrders " :key=" order._id " :order=" order "
                            @fetchOrders=" fetchOrders ">
                        </OrderCard>
                    </div>
                </template>

                <template v-else>
                    <div class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p class="text-xl font-medium text-gray-400">Không tìm thấy đơn hàng nào phù hợp</p>
                    </div>
                </template>
            </div>
        </div>
        <Footer></Footer>
    </div>
</template>