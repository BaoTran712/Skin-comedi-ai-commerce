<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import { ref, onMounted, computed } from "vue";
import { push } from "notivue";
import { useRouter } from "vue-router";
import ProductService from "../services/product.service.js";
import AdminStatsService from "../services/adminStats.service.js";
import ChartCard from "../components/ChartCard.vue";

const router = useRouter();

const productService = new ProductService();
const statsService = new AdminStatsService();

const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  confirmedOrders: 0,
  shippingOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  totalRevenue: 0,
  totalCustomers: 0,
  totalProducts: 0
});

const lowStockProducts = ref(0);
const isLoading = ref(true);

// Time filtering state
const period = ref("month"); // 'day', 'month', 'quarter', 'year'

const now = new Date();
const selectedYear = ref(now.getFullYear());
const selectedMonth = ref(now.getMonth() + 1);
const selectedQuarter = ref(Math.ceil((now.getMonth() + 1) / 3));
const selectedDay = ref(now.toISOString().slice(0, 10));

const yearsRange = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);
});

// Navigation History Stack for Drill-down
const filterHistory = ref([]);

const revenueLabels = ref([]);
const revenueData = ref([]);

// Compute formatted date parameter for API call
const filterDateValue = computed(() => {
  if (period.value === "day") {
    return selectedDay.value; // YYYY-MM-DD
  } else if (period.value === "month") {
    return `${selectedYear.value}-${selectedMonth.value.toString().padStart(2, '0')}`; // YYYY-MM
  } else if (period.value === "quarter") {
    return `${selectedYear.value}-Q${selectedQuarter.value}`; // YYYY-Qx
  } else if (period.value === "year") {
    return `${selectedYear.value}`; // YYYY
  }
  return "";
});

// Human readable active filter description
const filterDescription = computed(() => {
  if (period.value === "day") {
    const parts = selectedDay.value.split('-');
    return `Ngày ${parts[2] || ''}/${parts[1] || ''}/${parts[0] || ''}`;
  } else if (period.value === "month") {
    return `Tháng ${selectedMonth.value.toString().padStart(2, '0')}/${selectedYear.value}`;
  } else if (period.value === "quarter") {
    return `Quý ${selectedQuarter.value === 1 ? 'I' : selectedQuarter.value === 2 ? 'II' : selectedQuarter.value === 3 ? 'III' : 'IV'}/${selectedYear.value}`;
  } else if (period.value === "year") {
    return `Năm ${selectedYear.value}`;
  }
  return "";
});

const fetchDashboardData = async (clearHistory = true) => {
  try {
    isLoading.value = true;
    if (clearHistory) {
      filterHistory.value = [];
    }

    // Call single optimized stats endpoint
    const data = await statsService.getDashboardStats(period.value, filterDateValue.value);
    
    stats.value = data.summary;
    revenueLabels.value = data.chart.labels;
    revenueData.value = data.chart.values;

    // Fetch low stock alerts (real-time current stock, independent of time filter)
    const products = await productService.getAllProducts();
    lowStockProducts.value = products.filter(p => p.quantity < 10).length;
  } catch (error) {
    console.error(error);
    push.error("Lỗi khi tải thống kê hệ thống");
  } finally {
    isLoading.value = false;
  }
};

const setPeriod = (newPeriod) => {
  period.value = newPeriod;
};

const applyFilters = () => {
  fetchDashboardData(true);
};

const goBack = () => {
  if (filterHistory.value.length > 0) {
    const prev = filterHistory.value.pop();
    period.value = prev.period;
    
    // Restore selection variables
    if (prev.period === 'year') {
      selectedYear.value = parseInt(prev.date, 10);
    } else if (prev.period === 'quarter') {
      const parts = prev.date.split('-Q');
      selectedYear.value = parseInt(parts[0], 10);
      selectedQuarter.value = parseInt(parts[1], 10);
    } else if (prev.period === 'month') {
      const parts = prev.date.split('-');
      selectedYear.value = parseInt(parts[0], 10);
      selectedMonth.value = parseInt(parts[1], 10);
    } else if (prev.period === 'day') {
      selectedDay.value = prev.date;
    }
    
    fetchDashboardData(false);
  }
};

const handleChartClick = ({ label }) => {
  if (period.value === 'year' || period.value === 'quarter') {
    // Label structure is e.g. "T7" or "T07"
    const monthNum = parseInt(label.replace('T', ''), 10);
    if (!isNaN(monthNum)) {
      // Save history before drilling down
      filterHistory.value.push({
        period: period.value,
        date: filterDateValue.value
      });
      
      period.value = 'month';
      selectedMonth.value = monthNum;
      fetchDashboardData(false);
    }
  } else if (period.value === 'month') {
    // Label structure is e.g. "12/08" (dd/mm)
    const parts = label.split('/');
    const dayNum = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);
    if (!isNaN(dayNum) && !isNaN(monthNum)) {
      // Save history before drilling down
      filterHistory.value.push({
        period: period.value,
        date: filterDateValue.value
      });
      
      period.value = 'day';
      selectedDay.value = `${selectedYear.value}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      fetchDashboardData(false);
    }
  }
};

onMounted(() => {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  if (role !== "STAFF" && role !== "ADMIN") {
    router.push("/");
    return;
  }
  fetchDashboardData(true);
});

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

// Build query params to navigate to Order Management with same active filter
const buildOrderMgmtQuery = (extraStatus = '') => {
  const q = { period: period.value };
  if (period.value === 'day')     { q.day = selectedDay.value; }
  if (period.value === 'month')   { q.year = selectedYear.value; q.month = selectedMonth.value; }
  if (period.value === 'quarter') { q.year = selectedYear.value; q.month = (selectedQuarter.value - 1) * 3 + 1; }
  if (period.value === 'year')    { q.year = selectedYear.value; }
  if (extraStatus) q.status = extraStatus;
  return q;
};

const goToOrders = (status = '') => {
  router.push({ name: 'order.pending', query: buildOrderMgmtQuery(status) });
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
        <button @click="() => fetchDashboardData(true)" class="btn btn-ghost btn-circle bg-white shadow-sm border border-gray-100 hover:bg-gray-100">
          <span class="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      <!-- Time Filter Panel -->
      <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-2">
          <button v-if="filterHistory.length > 0" @click="goBack" class="btn btn-outline btn-sm rounded-xl mr-2 flex items-center gap-1 border-gray-300">
            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
            Quay lại
          </button>
          
          <div class="join border border-gray-200 p-0.5 rounded-xl bg-gray-50">
            <button v-for="p in ['day', 'month', 'quarter', 'year']" :key="p"
                    @click="setPeriod(p)"
                    :class="['join-item btn btn-sm border-none rounded-lg text-xs font-bold px-4', period === p ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-100']">
              {{ p === 'day' ? 'Ngày' : p === 'month' ? 'Tháng' : p === 'quarter' ? 'Quý' : 'Năm' }}
            </button>
          </div>
          <span class="text-sm font-bold text-gray-600 ml-2">Mốc lọc: {{ filterDescription }}</span>
        </div>

        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <!-- Day filter -->
          <div v-if="period === 'day'" class="flex items-center">
            <input type="date" v-model="selectedDay" class="input input-bordered input-sm rounded-xl text-xs font-semibold bg-white" />
          </div>

          <!-- Month filter -->
          <div v-if="period === 'month'" class="flex items-center gap-2">
            <select v-model="selectedMonth" class="select select-bordered select-sm rounded-xl text-xs font-semibold bg-white">
              <option v-for="m in 12" :key="m" :value="m">Tháng {{ m.toString().padStart(2, '0') }}</option>
            </select>
            <select v-model="selectedYear" class="select select-bordered select-sm rounded-xl text-xs font-semibold bg-white">
              <option v-for="y in yearsRange" :key="y" :value="y">Năm {{ y }}</option>
            </select>
          </div>

          <!-- Quarter filter -->
          <div v-if="period === 'quarter'" class="flex items-center gap-2">
            <select v-model="selectedQuarter" class="select select-bordered select-sm rounded-xl text-xs font-semibold bg-white">
              <option :value="1">Quý I</option>
              <option :value="2">Quý II</option>
              <option :value="3">Quý III</option>
              <option :value="4">Quý IV</option>
            </select>
            <select v-model="selectedYear" class="select select-bordered select-sm rounded-xl text-xs font-semibold bg-white">
              <option v-for="y in yearsRange" :key="y" :value="y">Năm {{ y }}</option>
            </select>
          </div>

          <!-- Year filter -->
          <div v-if="period === 'year'" class="flex items-center">
            <select v-model="selectedYear" class="select select-bordered select-sm rounded-xl text-xs font-semibold bg-white">
              <option v-for="y in yearsRange" :key="y" :value="y">Năm {{ y }}</option>
            </select>
          </div>
          
          <button @click="applyFilters" class="btn btn-primary btn-sm rounded-xl text-xs font-bold shadow-md">Lọc</button>
        </div>
      </div>

      <!-- Stats Overview -->
      <div v-if="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Orders -->
        <div @click="goToOrders()" class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <span class="material-symbols-outlined text-[32px]" style="font-variation-settings: 'FILL' 1;">shopping_bag</span>
            </div>
            <span class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1">Tổng đơn <span class="material-symbols-outlined text-[14px]">open_in_new</span></span>
          </div>
          <div class="mt-4">
            <h2 class="text-3xl font-black text-gray-900">{{ stats.totalOrders }}</h2>
            <p class="text-gray-500 text-sm">Tất cả đơn hàng trong kỳ</p>
          </div>
        </div>

        <!-- Revenue KPI -->
        <div @click="goToOrders('revenue')" class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <span class="material-symbols-outlined text-[32px]" style="font-variation-settings: 'FILL' 1;">payments</span>
            </div>
            <span class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">Doanh thu <span class="material-symbols-outlined text-[14px]">open_in_new</span></span>
          </div>
          <div class="mt-4">
            <h2 class="text-3xl font-black text-gray-900">{{ formatPrice(stats.totalRevenue) }}</h2>
            <p class="text-gray-500 text-sm">Đơn delivered + completed</p>
          </div>
        </div>

        <!-- Customers -->
        <div @click="goToOrders()" class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
          <div class="flex justify-between items-start">
            <div class="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <span class="material-symbols-outlined text-[32px]" style="font-variation-settings: 'FILL' 1;">group</span>
            </div>
            <span class="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-lg flex items-center gap-1">Khách hàng <span class="material-symbols-outlined text-[14px]">open_in_new</span></span>
          </div>
          <div class="mt-4">
            <h2 class="text-3xl font-black text-gray-900">{{ stats.totalCustomers }}</h2>
            <p class="text-gray-500 text-sm">Người mua phát sinh đơn</p>
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
            <h2 class="text-3xl font-black text-gray-900">{{ stats.totalProducts }}</h2>
            <p class="text-gray-500 text-sm">Mã SKU bán ra (delivered/completed)</p>
          </div>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div v-if="!isLoading" class="mt-8">
        <ChartCard
          :title="`Doanh thu (${filterDescription})`"
          :labels="revenueLabels"
          :data="revenueData"
          chart-type="line"
          @chartClick="handleChartClick"
        />
        <div class="text-xs text-gray-400 mt-2 font-medium">
          💡 Nhấp vào một điểm/cột mốc trên biểu đồ để xem chi tiết khoảng thời gian (Drill-down).
        </div>
      </div>

      <!-- Secondary Stats -->
      <div v-if="!isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <!-- Order Status Distribution -->
        <div class="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 class="text-xl font-bold text-gray-800 mb-6">Trạng thái đơn hàng ({{ filterDescription }})</h3>
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
                <p class="text-sm text-gray-500">Tổng lượt chẩn đoán AI: {{ stats.totalDiagnoses }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl">
              <div class="p-2 bg-white rounded-xl text-rose-600">
                <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">pie_chart</span>
              </div>
              <div>
                                <h4 class="font-bold text-gray-800">Báo cáo thuế</h4>
                <p class="text-sm text-gray-500">Tổng thuế VAT: {{ formatPrice(stats.taxTotal) }}</p>
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
