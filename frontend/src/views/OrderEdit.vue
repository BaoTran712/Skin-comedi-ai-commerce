<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import InputSearch from "../components/InputSearch.vue";
import OrderCard from "../components/OrderCard.vue";

import { useRouter } from "vue-router";
import { ref, computed, onMounted } from 'vue';
import OrderService from "../services/order.service";

const router = useRouter();
const borrowService = new OrderService();
const role = computed(() => localStorage.getItem("role"));
const id = computed(() => localStorage.getItem("id"));

const orders = ref([]);
const searchText = ref("");
const filteredStatus = ref("");
const filteredStatusText = ref("");

const fetchOrders = async () => {
    try {
        const response = await borrowService.getAllOrders();
        // debug code later
        // console.log(response);
        orders.value = response.filter(order => order.user_id?._id === id.value);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        for (const order of orders.value) {
            const returnDate = new Date(order.return_date).setHours(0, 0, 0, 0);
            if ((now > returnDate && order.status !== "returned" && order.status !== "rejected")) {
                await borrowService.updateOrder(order._id, { status: "overdue" });
            }
        };
    } catch (error) {
        console.error(error);
    }
};

const handleFilterStatus = (status) => {
    filteredStatus.value = status;
    switch (status) {
        case "pending":
            filteredStatusText.value = "Chờ duyệt";
            break;
        case "return_pending":
            filteredStatusText.value = "Chờ duyệt trả";
            break;
        case "borrowing":
            filteredStatusText.value = "Đang mượn";
            break;
        case "returned":
            filteredStatusText.value = "Đã trả";
            break;
        case "rejected":
            filteredStatusText.value = "Từ chối";
            break;
        case "overdue":
            filteredStatusText.value = "Quá hạn";
            break;

        default:
            filteredStatusText.value = "Tất cả Sản phẩm";
            break;
    }
};

const filteredBorrows = computed(() => {
    let result = orders.value;

    if (filteredStatus.value) {
        return result.filter(order => order.status === filteredStatus.value);
    }

    if (searchText.value) {

        const keyword = searchText.value.toLowerCase();

        return orders.value.filter(order => {
            const searchableText = [order.product_id?.title]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(keyword);
        });
    }

    return orders.value;
});

onMounted(async () => {
    fetchOrders();
    fetchOrders();
});
</script>

<template>
    <div class="flex flex-col min-h-screen overflow-hidden">
        <Header></Header>
        <div class="flex-grow mx-8 sm:mx-16 lg:mx-24 my-8">
            <div class="flex flex-col sm:flex-row gap-2 justify-center mb-8 w-full">

                <div class="tooltip" data-tip="Tựa Sản phẩm">
                    <InputSearch class="w-full" v-model=" searchText "></InputSearch>
                </div>
                <div class="dropdown dropdown-center flex justify-center">
                    <div tabindex="0" role="button" class="btn bg-base-100 hover:bg-base-300">{{ filteredStatusText ||
                        "Tất cả Sản phẩm" }}
                    </div>
                    <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                        <li><a @click="handleFilterStatus( '' )">Tất cả Sản phẩm</a></li>
                        <li><a @click="handleFilterStatus( 'pending' )">Chờ duyệt</a></li>
                        <li><a @click="handleFilterStatus( 'borrowing' )">Đang mượn</a></li>
                        <li><a @click="handleFilterStatus( 'return_pending' )">Chờ duyệt trả</a></li>
                        <li><a @click="handleFilterStatus( 'returned' )">Đã trả</a></li>
                        <li><a @click="handleFilterStatus( 'rejected' )">Từ chối</a></li>
                        <li><a @click="handleFilterStatus( 'overdue' )">Quá hạn</a></li>
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
                    <p class="py-6 font-bold">Hiện tại chưa có đơn đơn hàng</p>
                </div>
            </template>
        </div>
        <Footer></Footer>
    </div>
</template>