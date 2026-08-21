<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import InputSearch from "../components/InputSearch.vue";
import OrderCard from "../components/OrderCard.vue";

import { useRouter } from "vue-router";
import { ref, computed, onMounted } from 'vue';
import OrderService from "../services/order.service";

const router = useRouter();
const orderService = new OrderService();
const role = computed(() => localStorage.getItem("role"));
const id = computed(() => localStorage.getItem("id"));

const orders = ref([]);
const searchText = ref("");
const filteredStatus = ref("");
const filteredStatusText = ref("");

const fetchOrders = async () => {
    try {
        orders.value = await orderService.getAllOrders({ user_id: id.value });
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
        case "completed":
            filteredStatusText.value = "Đã hoàn thành";
            break;
        case "cancelled":
            filteredStatusText.value = "Đã hủy";
            break;
        default:
            filteredStatusText.value = "Tất cả đơn hàng";
            break;
    }
};

const filteredBorrows = computed(() => {
    let result = orders.value;

    if (filteredStatus.value) {
        result = result.filter(order => order.status === filteredStatus.value);
    }

    if (searchText.value) {
        const keyword = searchText.value.toLowerCase();
        result = result.filter(order => {
            const searchableText = [order._id, order.product_id?.title]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return searchableText.includes(keyword);
        });
    }

    return result;
});

onMounted(async () => {
    fetchOrders();
});
</script>

<template>
    <div class="flex flex-col min-h-screen overflow-hidden">
        <Header></Header>
        <div class="flex-grow mx-8 sm:mx-16 lg:mx-24 my-8">
            <div class="flex flex-col sm:flex-row gap-2 justify-center mb-8 w-full">

                <div class="tooltip" data-tip="Tên sản phẩm hoặc mã đơn">
                    <InputSearch class="w-full" v-model=" searchText "></InputSearch>
                </div>
                <div class="dropdown dropdown-center flex justify-center">
                    <div tabindex="0" role="button" class="btn bg-base-100 hover:bg-base-300">{{ filteredStatusText ||
                        "Tất cả đơn hàng" }}
                    </div>
                    <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                        <li><a @click="handleFilterStatus( '' )">Tất cả đơn hàng</a></li>
                        <li><a @click="handleFilterStatus( 'pending' )">Chờ xác nhận</a></li>
                        <li><a @click="handleFilterStatus( 'confirmed' )">Đã xác nhận</a></li>
                        <li><a @click="handleFilterStatus( 'shipping' )">Đang giao hàng</a></li>
                        <li><a @click="handleFilterStatus( 'delivered' )">Đã giao hàng</a></li>
                        <li><a @click="handleFilterStatus( 'completed' )">Đã hoàn thành</a></li>
                        <li><a @click="handleFilterStatus( 'cancelled' )">Đã hủy</a></li>
                    </ul>
                </div>

            </div>
            <template v-if=" filteredBorrows.length > 0 ">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                    <OrderCard v-for=" order in filteredBorrows " :key=" order._id " :order=" order "
                        @fetchOrders=" fetchOrders ">
                    </OrderCard>
                </div>
            </template>
            <template v-else>
                <div class="grid grid-cols-1 text-center">
                    <p class="py-6 font-bold">Hiện tại chưa có đơn hàng nào</p>
                </div>
            </template>
        </div>
        <Footer></Footer>
    </div>
</template>