<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import { ref, onMounted, watch } from "vue";
import { push } from "notivue";
import { useRouter } from "vue-router";
import OrderService from "../services/order.service.js";
import ProductService from "../services/product.service.js";
import UserService from "../services/user.service.js";
import AdminRevenueService from "../services/adminRevenue.service.js";
import ChartCard from "../components/ChartCard.vue";

const router = useRouter();

const orderService = new OrderService();
const productService = new ProductService();
const userService = new UserService();
const revenueService = new AdminRevenueService();

const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  confirmedOrders: 0,
  shippingOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  totalRevenue: 0,
});

const totalProducts = ref(0);
const lowStockProducts = ref(0);
const totalUsers = ref(0);

const isLoading = ref(true);

// Chart state
const period = ref("day");
const periodOptions = ["day", "week", "month", "quarter", "year"];
const revenueLabels = ref([]);
const revenueData = ref([]);

const fetchStats = async () => {
  try {
    isLoading.value = true;
    const [orderStats, products, users] = await Promise.all([
      orderService.getStats(),
      productService.getAllProducts(),
      userService.getAllUsers(),
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

const fetchRevenue = async () => {
  try {
    const data = await revenueService.getRevenueByPeriod(period.value);
    revenueLabels.value = data.map(d => d.label);
    revenueData.value = data.map(d => d.revenue);
  } catch (e) {
    console.error(e);
    push.error("Lỗi khi tải doanh thu");
  }
};

onMounted(() => {
  const role = localStorage.getItem("role");
  if (role !== "staff") {
    router.push("/");
    return;
  }
  fetchStats();
  fetchRevenue();
});

watch(period, fetchRevenue);

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
</script>

<template>
  <AdminLayout>
    <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-4xl font-extrabold text-gray-900">Bảng điều khiển quản trị</h1>
          <p class="text-gray-500 mt-1">Chào mừng quay trở lại. Đây là tình hình kinh doanh của Testskin.</p>
        </div>
        <button @click="fetchStats" class="btn btn-ghost btn-circle bg-white shadow-sm border border-gray-100 hover:bg-gray-100">
          <span class="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      <!-- Stats Overview -->
      <div v-if="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Orders -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <span class="material-symbols-outlined text-[32px]" style="font-variation-settings: 'FILL' 1;">shopping_bag</span>
            </div>
            <span class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Tổng đơn</span>
          </div>
          <div class="mt-4">
            <h2 class="text-3xl font-black text-gray-900">{{ stats.totalOrders }}</h2>
            <p class="text-gray-500 text-sm">Đơn hàng đã đặt</p>
          </div>
        </div>

        <!-- Revenue KPI -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <span class="material-symbols-outlined text-[32px]" style="font-variation-settings: 'FILL' 1;">payments</span>
            </div>
            <span class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">Doanh thu</span>
          </div>
          <div class="mt-4">
            <h2 class="text-3xl font-black text-gray-900">{{ formatPrice(stats.totalRevenue) }}</h2>
            <p class="text-gray-5 text-sm">Doanh thu thực nhận</p>
          </div>
        </div>

        <!-- Users -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <span class="material-symbols-outlined text-[32px]" style="font-variation-settings: 'FILL' 1;">group</span>
            </div>
            <span class="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-lg">Khách hàng</span>
          </div>
          <div class="mt-4">
            <h2 class="text-3xl font-black text-gray-900">{{ totalUsers }}</h2>
            <p class="text-gray-500 text-sm">Người dùng đăng ký</p>
          </div>
        </div>

        <!-- Products -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <span class="material-symbols-outlined text-[32px]" style="font-variation-settings: 'FILL' 1;">inventory_2</span>
            </div>
            <span class="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">Sản phẩm</span>
          </div>
          <div class="mt-4">
            <h2 class="text-3xl font-black text-gray-900">{{ totalProducts }}</h2>
            <p class="text-gray-500 text-sm">Mã sản phẩm đang bán</p>
          </div>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div v-if="!isLoading" class="mt-8">
        <ChartCard
          :title="`Doanh thu (${period.toUpperCase()})`"
          :labels="revenueLabels"
          :data="revenueData"
          chart-type="line"
        />
        <select v-model="period" class="mt-2 p-2 border rounded bg-white focus:outline-none">
          <option v-for="opt in periodOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>

      <!-- Secondary Stats -->
      <div v-if="!isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
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
            <span class="material-symbols-outlined text-amber-500 mb-4" style="font-size: 48px; font-variation-settings: 'FILL' 1;">inventory_2</span>
            <h4 class="text-lg font-bold text-gray-700">{{ lowStockProducts }} sản phẩm</h4>
            <p class="text-gray-500 text-sm text-center">Có ít hơn 10 sản phẩm trong kho</p>
            <RouterLink to="/products" class="mt-4 text-primary font-bold hover:underline">Quản lý kho</RouterLink>
          </div>

          <div class="mt-8 space-y-4">
            <div class="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
              <div class="p-2 bg-white rounded-xl text-blue-600">
                <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">analytics</span>
              </div>
              <div>
                <h4 class="font-bold text-gray-800">Thống kê AI</h4>
                <p class="text-sm text-gray-500">Xem kết quả phân tích AI</p>
              </div>
            </div>
            <div class="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl">
              <div class="p-2 bg-white rounded-xl text-rose-600">
                <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">pie_chart</span>
              </div>
              <div>
                <h4 class="font-bold text-gray-800">Báo cáo thuế</h4>
                <p class="text-sm text-gray-5">Xuất dữ liệu hóa đơn</p>
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
  </AdminLayout>
</template>
