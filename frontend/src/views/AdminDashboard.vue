<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import { ref, onMounted, computed } from "vue";
import OrderService from "../services/order.service";
import ProductService from "../services/product.service";
import UserService from "../services/user.service";
import { push } from "notivue";
import { useRouter } from "vue-router";

const orderService = new OrderService();
const productService = new ProductService();
const userService = new UserService();
const router = useRouter();

const stats = ref({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0
});

const totalProducts = ref(0);
const lowStockProducts = ref(0);
const totalUsers = ref(0);
const isLoading = ref(true);

const fetchStats = async () => {
    try {
        isLoading.value = true;
        const [orderStats, products, users] = await Promise.all([
            orderService.getStats(),
            productService.getAllProducts(),
            userService.getAllUsers()
        ]);

        stats.value = orderStats;
        totalProducts.value = products.length;
        lowStockProducts.value = products.filter(p => p.quantity < 10).length;
        totalUsers.value = users.length;
    } catch (error) {
        console.error(error);
        push.error("Lỗi khi tải thống kê hệ thống");
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    const role = localStorage.getItem("role");
    if (role !== "staff") {
        router.push("/");
        return;
    }
    fetchStats();
});

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

</script>

<template>
    <div class="flex flex-col min-h-screen bg-gray-50">
        <Header />
        
        <main class="flex-grow container mx-auto px-4 py-8">
            <div class="flex flex-col gap-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-4xl font-extrabold text-gray-900">Bảng điều khiển quản trị</h1>
                        <p class="text-gray-500 mt-1">Chào mừng quay trở lại. Đây là tình hình kinh doanh của Testskin.</p>
                    </div>
                    <button @click="fetchStats" class="btn btn-ghost btn-circle bg-white shadow-sm border border-gray-100 hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>

                <!-- Stats Overview -->
                <div v-if="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div class="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            </div>
                            <span class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Tổng đơn</span>
                        </div>
                        <div class="mt-4">
                            <h2 class="text-3xl font-black text-gray-900">{{ stats.totalOrders }}</h2>
                            <p class="text-gray-500 text-sm">Đơn hàng đã đặt</p>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div class="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">Doanh thu</span>
                        </div>
                        <div class="mt-4">
                            <h2 class="text-3xl font-black text-gray-900">{{ formatPrice(stats.totalRevenue) }}</h2>
                            <p class="text-gray-500 text-sm">Doanh thu thực nhận</p>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div class="p-3 bg-purple-50 rounded-2xl text-purple-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <span class="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-lg">Khách hàng</span>
                        </div>
                        <div class="mt-4">
                            <h2 class="text-3xl font-black text-gray-900">{{ totalUsers }}</h2>
                            <p class="text-gray-500 text-sm">Người dùng đăng ký</p>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start">
                            <div class="p-3 bg-amber-50 rounded-2xl text-amber-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <span class="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">Sản phẩm</span>
                        </div>
                        <div class="mt-4">
                            <h2 class="text-3xl font-black text-gray-900">{{ totalProducts }}</h2>
                            <p class="text-gray-500 text-sm">Mã sản phẩm đang bán</p>
                        </div>
                    </div>
                </div>

                <!-- Secondary Stats -->
                <div v-if="!isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Order Status Distribution -->
                    <div class="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 class="text-xl font-bold text-gray-800 mb-6">Trạng thái đơn hàng</h3>
                        <div class="space-y-6">
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="font-medium">Chờ xác nhận</span>
                                    <span class="text-gray-500">{{ stats.pendingOrders }} đơn</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-amber-400 h-2 rounded-full" :style="{ width: (stats.pendingOrders / stats.totalOrders * 100 || 0) + '%' }"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="font-medium">Đã xác nhận</span>
                                    <span class="text-gray-500">{{ stats.confirmedOrders }} đơn</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-blue-400 h-2 rounded-full" :style="{ width: (stats.confirmedOrders / stats.totalOrders * 100 || 0) + '%' }"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="font-medium">Đang giao</span>
                                    <span class="text-gray-500">{{ stats.shippingOrders }} đơn</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-indigo-400 h-2 rounded-full" :style="{ width: (stats.shippingOrders / stats.totalOrders * 100 || 0) + '%' }"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="font-medium">Đã hoàn tất</span>
                                    <span class="text-gray-500">{{ stats.deliveredOrders }} đơn</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-emerald-400 h-2 rounded-full" :style="{ width: (stats.deliveredOrders / stats.totalOrders * 100 || 0) + '%' }"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-2 text-red-500">
                                    <span class="font-medium">Đã hủy</span>
                                    <span>{{ stats.cancelledOrders }} đơn</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2">
                                    <div class="bg-red-400 h-2 rounded-full" :style="{ width: (stats.cancelledOrders / stats.totalOrders * 100 || 0) + '%' }"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stock Alerts -->
                    <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 class="text-xl font-bold text-gray-800 mb-6">Cảnh báo tồn kho</h3>
                        <div class="flex flex-col items-center justify-center h-48 py-8 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <span class="text-4xl mb-4">📦</span>
                            <h4 class="text-lg font-bold text-gray-700">{{ lowStockProducts }} sản phẩm</h4>
                            <p class="text-gray-500 text-sm text-center">Có ít hơn 10 sản phẩm trong kho</p>
                            <RouterLink to="/products" class="mt-4 text-primary font-bold hover:underline">Quản lý kho</RouterLink>
                        </div>
                        
                        <div class="mt-8 space-y-4">
                            <div class="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                                <div class="p-2 bg-white rounded-xl text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-800">Thống kê AI</h4>
                                    <p class="text-sm text-gray-500">Xem kết quả phân tích AI</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl">
                                <div class="p-2 bg-white rounded-xl text-rose-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-800">Báo cáo thuế</h4>
                                    <p class="text-sm text-gray-500">Xuất dữ liệu hóa đơn</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Skeleton Loading -->
                <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div v-for="i in 4" :key="i" class="bg-white p-6 rounded-3xl h-40 skeleton"></div>
                </div>
            </div>
        </main>

        <Footer />
    </div>
</template>
