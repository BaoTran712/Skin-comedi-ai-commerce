<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import InputSearch from "../components/InputSearch.vue";

import { useRouter, useRoute } from "vue-router";
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import OrderService from "../services/order.service";
import PaymentService from "../services/payment.service";
import { push } from "notivue";

const router = useRouter();
const route  = useRoute();
const orderService = new OrderService();
const paymentService = new PaymentService();
const role     = computed(() => (localStorage.getItem("role") || "").toUpperCase());
const staff_id = computed(() => localStorage.getItem("id"));

// Server-side paginated states
const orders        = ref([]);
const totalOrders   = ref(0);
const totalPages    = ref(1);
const currentPage   = ref(1);
const pageSize      = 10;
const isRefreshing  = ref(false);
let refreshInterval = null;

// Search query
const searchText    = ref("");

// Status filter
const filteredStatus     = ref("");
const filteredStatusText = ref("");

// Statistics and status counts
const totalRevenue  = ref(0);
const delayedCount  = ref(0);
const statusCounts  = ref({ pending: 0, confirmed: 0, shipping: 0, delivered: 0, completed: 0, cancelled: 0 });

// ─── Date-range filter (mirrors Dashboard logic) ─────────────────────────────
const now          = new Date();
const dateFilterPeriod = ref("all");   // all | day | month | quarter | year
const filterYear   = ref(now.getFullYear());
const filterMonth  = ref(now.getMonth() + 1);
const filterDay    = ref(now.toISOString().slice(0, 10));

// ─── Advanced Search Panel ──────────────────────────────────────────────────
const showAdvanced     = ref(false);
const advMinAmount     = ref("");
const advMaxAmount     = ref("");
const advPaymentMethod = ref("");
const advPaymentStatus = ref("");
const advStartDate     = ref("");
const advEndDate       = ref("");

// Build start/end date identical to backend getPeriodRanges
function buildRange(period) {
    if (period === 'all') return { start: null, end: null };

    const y = filterYear.value;
    const m = filterMonth.value;
    const d = parseInt(filterDay.value.split('-')[2] || '1', 10);

    let start, end;
    if (period === 'day') {
        const mm = m.toString().padStart(2, '0');
        const dd = d.toString().padStart(2, '0');
        start = new Date(`${y}-${mm}-${dd}T00:00:00+07:00`);
        end   = new Date(`${y}-${mm}-${dd}T23:59:59.999+07:00`);
    } else if (period === 'month') {
        const mm      = m.toString().padStart(2, '0');
        const lastDay = new Date(y, m, 0).getDate();
        start = new Date(`${y}-${mm}-01T00:00:00+07:00`);
        end   = new Date(`${y}-${mm}-${lastDay.toString().padStart(2, '0')}T23:59:59.999+07:00`);
    } else if (period === 'quarter') {
        const q = Math.ceil(m / 3);
        const sm = (q - 1) * 3 + 1;
        const em = q * 3;
        const ld = new Date(y, em, 0).getDate();
        start = new Date(`${y}-${sm.toString().padStart(2, '0')}-01T00:00:00+07:00`);
        end   = new Date(`${y}-${em.toString().padStart(2, '0')}-${ld.toString().padStart(2, '0')}T23:59:59.999+07:00`);
    } else if (period === 'year') {
        start = new Date(`${y}-01-01T00:00:00+07:00`);
        end   = new Date(`${y}-12-31T23:59:59.999+07:00`);
    }
    return { start, end };
}

const getQueryDates = () => {
    if (showAdvanced.value && (advStartDate.value || advEndDate.value)) {
        return {
            start: advStartDate.value ? new Date(`${advStartDate.value}T00:00:00+07:00`).toISOString() : null,
            end: advEndDate.value ? new Date(`${advEndDate.value}T23:59:59.999+07:00`).toISOString() : null
        };
    }
    const { start, end } = buildRange(dateFilterPeriod.value);
    return {
        start: start ? start.toISOString() : null,
        end: end ? end.toISOString() : null
    };
};

// Modal state
const showDetailModal = ref(false);
const selectedOrder   = ref(null);

const fetchOrders = async (silent = false) => {
    if (!silent) isRefreshing.value = true;
    try {
        const { start, end } = getQueryDates();

        const params = {
            paginate: "true",
            page: currentPage.value,
            limit: pageSize
        };

        if (searchText.value && searchText.value.trim() !== "") params.search = searchText.value.trim();
        if (filteredStatus.value && filteredStatus.value !== "") params.status = filteredStatus.value;
        if (start) params.startDate = start;
        if (end) params.endDate = end;
        if (advMinAmount.value && advMinAmount.value !== "") params.minAmount = advMinAmount.value;
        if (advMaxAmount.value && advMaxAmount.value !== "") params.maxAmount = advMaxAmount.value;
        if (advPaymentMethod.value && advPaymentMethod.value !== "") params.payment_method = advPaymentMethod.value;
        if (advPaymentStatus.value && advPaymentStatus.value !== "") params.payment_status = advPaymentStatus.value;

        const response = await orderService.getAllOrders(params);

        if (Array.isArray(response)) {
            orders.value = response;
            totalOrders.value = response.length;
            totalPages.value = Math.ceil(response.length / pageSize) || 1;
            totalRevenue.value = response.filter(o => ['delivered', 'completed'].includes(o.status)).reduce((s, o) => s + (o.total_amount || 0), 0);
            delayedCount.value = 0;
            const counts = { pending: 0, confirmed: 0, shipping: 0, delivered: 0, completed: 0, cancelled: 0 };
            response.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
            statusCounts.value = counts;
        } else if (response && Array.isArray(response.orders)) {
            orders.value = response.orders;
            totalOrders.value = response.total !== undefined ? response.total : response.orders.length;
            totalPages.value = response.totalPages || Math.ceil((response.total || response.orders.length) / pageSize) || 1;
            totalRevenue.value = response.totalRevenue || 0;
            delayedCount.value = response.delayedCount || 0;
            statusCounts.value = response.statusCounts || { pending: 0, confirmed: 0, shipping: 0, delivered: 0, completed: 0, cancelled: 0 };
        } else {
            orders.value = [];
            totalOrders.value = 0;
            totalPages.value = 1;
        }
    } catch (error) {
        console.error("fetchOrders error:", error);
        if (!silent) push.error("Lỗi khi tải danh sách đơn hàng: " + (error.response?.data?.message || error.message));
    } finally {
        if (!silent) isRefreshing.value = false;
    }
};

const handleManualRefresh = async () => {
    await fetchOrders(false);
    push.success("Đã đồng bộ đơn hàng mới nhất!");
};

const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
        fetchOrders(true);
    }
};

const computedDelayedOrders = computed(() => {
    const curDate = new Date();
    const oneDayAgo = new Date(curDate.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(curDate.getTime() - 3 * 24 * 60 * 60 * 1000);

    return orders.value.filter(order => {
        if (order.status === "pending") {
            const orderDate = new Date(order.order_date || order.createdAt);
            return orderDate < oneDayAgo;
        }
        if (order.status === "shipping") {
            const updateDate = new Date(order.updatedAt || order.order_date);
            return updateDate < threeDaysAgo;
        }
        return false;
    });
});

const onlyShowDelayedPending = ref(false);
const onlyShowDelayedShipping = ref(false);

const displayedOrders = computed(() => {
    if (onlyShowDelayedPending.value) {
        const curDate = new Date();
        const oneDayAgo = new Date(curDate.getTime() - 24 * 60 * 60 * 1000);
        return orders.value.filter(order => order.status === "pending" && new Date(order.order_date || order.createdAt) < oneDayAgo);
    }
    if (onlyShowDelayedShipping.value) {
        const curDate = new Date();
        const threeDaysAgo = new Date(curDate.getTime() - 3 * 24 * 60 * 60 * 1000);
        return orders.value.filter(order => order.status === "shipping" && new Date(order.updatedAt || order.order_date) < threeDaysAgo);
    }
    return orders.value;
});

const filterOnlyDelayedPending = () => {
    onlyShowDelayedPending.value = true;
    onlyShowDelayedShipping.value = false;
    filteredStatus.value = "pending";
    filteredStatusText.value = "Chờ xác nhận (Chậm trễ)";
};

const filterOnlyDelayedShipping = () => {
    onlyShowDelayedPending.value = false;
    onlyShowDelayedShipping.value = true;
    filteredStatus.value = "shipping";
    filteredStatusText.value = "Đang giao hàng (Chậm trễ)";
};

const handleFilterStatus = (status) => {
    onlyShowDelayedPending.value = false;
    onlyShowDelayedShipping.value = false;
    filteredStatus.value = status;
    currentPage.value = 1;
    const map = {
        pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận',
        shipping: 'Đang giao hàng', delivered: 'Đã giao hàng',
        completed: 'Đã hoàn thành', cancelled: 'Đã hủy',
        'revenue': 'Đơn tính doanh thu'
    };
    filteredStatusText.value = map[status] || 'Tất cả trạng thái';
};

const handleAdvancedSearch = () => {
    currentPage.value = 1;
    fetchOrders();
};

const resetAdvancedSearch = () => {
    advMinAmount.value = "";
    advMaxAmount.value = "";
    advPaymentMethod.value = "";
    advPaymentStatus.value = "";
    advStartDate.value = "";
    advEndDate.value = "";
    dateFilterPeriod.value = "all";
    currentPage.value = 1;
    fetchOrders();
};

const handleApproveAllPending = async () => {
    try {
        // Fetch all pending orders first to confirm count
        const pendingOrders = await orderService.getAllOrders({ status: "pending" });
        if (pendingOrders.length === 0) { push.info("Không có đơn hàng nào đang chờ xác nhận"); return; }
        if (confirm(`Xác nhận duyệt nhanh ${pendingOrders.length} đơn hàng?`)) {
            let ok = 0, fail = 0;
            for (const order of pendingOrders) {
                try {
                    await orderService.updateOrder(order._id, { status: "confirmed", staff_id: staff_id.value });
                    ok++;
                } catch (e) { fail++; }
            }
            if (ok > 0)   push.success(`Đã xác nhận ${ok} đơn hàng`);
            if (fail > 0) push.warning(`${fail} đơn không duyệt được`);
            fetchOrders();
        }
    } catch (error) { push.error("Lỗi khi duyệt hàng loạt"); }
};

const statusText = (status) => {
    const map = { 
        pending: 'Chờ xác nhận', 
        confirmed: 'Đã xác nhận', 
        shipping: 'Đang giao', 
        delivered: 'Đã giao', 
        completed: 'Hoàn thành', 
        return_requested: '⏳ Chờ duyệt hoàn hàng',
        returning: '🚚 Đang chuyển hoàn',
        returned: '📦 Đã nhận hàng hoàn',
        refunded: '💰 Đã hoàn tiền',
        cancelled: 'Đã hủy' 
    };
    return map[status] || status || 'Không xác định';
};

// Tất cả trạng thái sử dụng đồng nhất một style: nền xanh lá nhạt, chữ xanh lá đậm, viền nhạt bo tròn
const statusClass = (_status) => {
    return 'status-badge bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold';
};

const paymentStatusText = (status, payment_method, order_status) => {
    if (payment_method === 'COD') {
        if (status === 'paid' || order_status === 'delivered' || order_status === 'completed') {
            return '✓ Đã thu tiền COD';
        }
        return '💵 Thu COD khi giao';
    }
    switch (status) {
        case 'paid': return '✓ Đã thanh toán';
        case 'unpaid': return '⏳ Chờ chuyển khoản';
        case 'verifying': return '🔍 Đang kiểm tra CK';
        case 'refunded': return '💰 Đã hoàn tiền';
        case 'expired': return '⚠️ Hết hạn';
        default: return 'Chưa thanh toán';
    }
};

const paymentStatusClass = (status, payment_method, order_status) => {
    if (payment_method === 'COD') {
        if (status === 'paid' || order_status === 'delivered' || order_status === 'completed') {
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        }
        return 'bg-sky-50 text-sky-700 border border-sky-200';
    }
    switch (status) {
        case 'paid': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case 'verifying': return 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse';
        case 'refunded': return 'bg-teal-50 text-teal-700 border border-teal-200';
        case 'expired': return 'bg-rose-50 text-rose-700 border border-rose-200';
        default: return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
};

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
const formatAddress = (addr) => {
    if (!addr) return '---';
    if (typeof addr === 'string') return addr;
    if (addr.addressDetail) {
        return `${addr.addressDetail}${addr.wardName ? ', ' + addr.wardName : ''}${addr.districtName ? ', ' + addr.districtName : ''}${addr.provinceName ? ', ' + addr.provinceName : ''}`;
    }
    return '---';
};
const formatDate  = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const validTransitions = { 
    pending: ["confirmed", "cancelled"], 
    confirmed: ["shipping", "cancelled"], 
    shipping: ["delivered", "returning"], 
    delivered: ["completed", "return_requested"], 
    completed: ["return_requested"], 
    return_requested: ["returning", "refunded", "completed", "cancelled"],
    returning: ["returned"],
    returned: ["refunded"],
    refunded: [],
    cancelled: [] 
};
const getAvailableStatuses = (s) => [s, ...(validTransitions[s] || [])];

const updateOrderStatus = async (order, event) => {
    const newStatus = event.target.value;
    if (newStatus === order.status) return;
    try {
        let payload = { status: newStatus, staff_id: staff_id.value };
        if (newStatus === 'shipping') {
            const tracking = prompt("Nhập mã vận chuyển (nếu có):", order.tracking_number || "");
            if (tracking !== null) { payload.tracking_number = tracking; } else { event.target.value = order.status; return; }
        }
        if (newStatus === 'cancelled') {
            if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này? Tồn kho sẽ được hoàn trả.")) { event.target.value = order.status; return; }
        }
        await orderService.updateOrder(order._id, payload);
        push.success(`Cập nhật: ${statusText(newStatus)} thành công`);
        fetchOrders();
    } catch (error) {
        const msg = error.response?.data?.message || "Lỗi khi cập nhật trạng thái";
        push.error(msg);
        fetchOrders();
    }
};

const confirmPayment = async (order) => {
    if (confirm(`Xác nhận đã nhận chuyển khoản cho đơn hàng #${order.order_code || order._id}?`)) {
        try {
            await paymentService.adminConfirmPayment(order._id, { note: "Admin xác nhận thủ công" });
            push.success("Xác nhận thanh toán thành công!");
            if (selectedOrder.value && selectedOrder.value._id === order._id) {
                selectedOrder.value.payment_status = "paid";
            }
            fetchOrders();
        } catch (error) { 
            const msg = error.response?.data?.message || "Lỗi khi xác nhận thanh toán";
            push.error(msg); 
        }
    }
};

const openDetailModal  = (order) => { selectedOrder.value = order; showDetailModal.value = true; };
const closeDetailModal = () => { showDetailModal.value = false; selectedOrder.value = null; };

// Visible pages computed for pagination
const visiblePages = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const delta = 2;
    const range = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        range.push(i);
    }

    if (current - delta > 2) {
        range.unshift("...");
    }
    range.unshift(1);

    if (current + delta < total - 1) {
        range.push("...");
    }
    if (total > 1) {
        range.push(total);
    }

    return range;
});

// Read URL query params sent from Dashboard click-through
onMounted(async () => {
    if (role.value !== "STAFF" && role.value !== "ADMIN") { router.push("/"); return; }

    // Handle incoming query params from Dashboard click-through
    const { period, year, month, day, status } = route.query;
    if (period && period !== 'all') {
        dateFilterPeriod.value = period;
        if (year)  filterYear.value  = parseInt(year, 10);
        if (month) filterMonth.value = parseInt(month, 10);
        if (day)   filterDay.value   = day;
    }
    if (status) {
        handleFilterStatus(status);
    }

    await fetchOrders();

    // Auto-polling every 12 seconds
    refreshInterval = setInterval(() => {
        fetchOrders(true);
    }, 12000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
});

// Watch page change to fetch
watch(currentPage, () => {
    fetchOrders();
});

// Debounce watch for searchText
let debounceTimer = null;
watch(searchText, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentPage.value = 1;
        fetchOrders();
    }, 400);
});

// Watch standard filter changes
const handleFilterChange = () => {
    if (currentPage.value === 1) {
        fetchOrders();
    } else {
        currentPage.value = 1;
    }
};
watch([filteredStatus, dateFilterPeriod, filterYear, filterMonth, filterDay, advPaymentMethod, advPaymentStatus], handleFilterChange);

const filterPeriodLabel = computed(() => {
    const y = filterYear.value;
    const m = filterMonth.value.toString().padStart(2, '0');
    const q = Math.ceil(filterMonth.value / 3);
    const qLabel = ['I','II','III','IV'][q-1];
    if (dateFilterPeriod.value === 'day')     return filterDay.value;
    if (dateFilterPeriod.value === 'month')   return `Tháng ${m}/${y}`;
    if (dateFilterPeriod.value === 'quarter') return `Quý ${qLabel}/${y}`;
    if (dateFilterPeriod.value === 'year')    return `Năm ${y}`;
    return 'Tất cả thời gian';
});

const yearsRange = computed(() => {
    const cur = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => cur - 3 + i);
});
</script>

<template>
    <AdminLayout>
        <div class="flex flex-col gap-6 text-left">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
                    <p class="text-sm text-gray-500 mt-1">
                        Tổng cộng <span class="font-semibold text-gray-800">{{ totalOrders }}</span> đơn hàng
                        <span v-if="dateFilterPeriod !== 'all' || (showAdvanced && (advStartDate || advEndDate))" class="text-primary font-medium ml-1">
                            — {{ showAdvanced && (advStartDate || advEndDate) ? 'Khoảng thời gian chọn' : filterPeriodLabel }}
                        </span>
                        <span class="ml-2 text-emerald-600 font-semibold">
                            · Doanh thu lọc: {{ formatPrice(totalRevenue) }}
                        </span>
                    </p>
                </div>

                <div class="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
                    <div class="tooltip" data-tip="Tìm mã đơn hàng, sản phẩm, khách, SĐT...">
                        <InputSearch class="w-64" v-model="searchText"></InputSearch>
                    </div>

                    <!-- Status filter -->
                    <div class="dropdown dropdown-end">
                        <div tabindex="0" role="button" class="btn btn-outline border-gray-300">
                            <span class="text-gray-600">{{ filteredStatusText || "Tất cả trạng thái" }}</span>
                        </div>
                        <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-56 p-2 shadow-lg border border-gray-100">
                            <li><a @click="handleFilterStatus('')">Tất cả</a></li>
                            <li><a @click="handleFilterStatus('pending')">Chờ xác nhận <span v-if="statusCounts.pending > 0" class="badge badge-warning badge-sm text-white">{{ statusCounts.pending }}</span></a></li>
                            <li><a @click="handleFilterStatus('confirmed')">Đã xác nhận <span v-if="statusCounts.confirmed > 0" class="badge badge-info badge-sm text-white">{{ statusCounts.confirmed }}</span></a></li>
                            <li><a @click="handleFilterStatus('shipping')">Đang giao hàng <span v-if="statusCounts.shipping > 0" class="badge badge-primary badge-sm text-white">{{ statusCounts.shipping }}</span></a></li>
                            <li><a @click="handleFilterStatus('delivered')">Đã giao hàng</a></li>
                            <li><a @click="handleFilterStatus('completed')">Đã hoàn thành</a></li>
                            <li class="border-t border-gray-100 mt-1 pt-1"><a @click="handleFilterStatus('return_requested')" class="text-amber-600 font-bold">⏳ Yêu cầu hoàn hàng</a></li>
                            <li><a @click="handleFilterStatus('returning')">🚚 Đang chuyển hoàn</a></li>
                            <li><a @click="handleFilterStatus('refunded')" class="text-teal-600 font-bold">💰 Đã hoàn tiền</a></li>
                            <li><a @click="handleFilterStatus('cancelled')">Đã hủy</a></li>
                            <li class="border-t border-gray-100 mt-1 pt-1"><a @click="handleFilterStatus('revenue')" class="text-emerald-600 font-semibold">💰 Đơn tính doanh thu</a></li>
                        </ul>
                    </div>

                    <button 
                        @click="handleManualRefresh" 
                        :disabled="isRefreshing" 
                        title="Làm mới danh sách đơn hàng" 
                        class="btn btn-outline border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 flex items-center gap-1.5">
                        <svg class="w-4 h-4 transition-transform duration-500" :class="{ 'animate-spin text-emerald-600': isRefreshing }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Làm mới</span>
                    </button>

                    <button class="btn btn-primary shadow-md" @click="handleApproveAllPending">
                        ✅ Duyệt nhanh
                        <span v-if="statusCounts.pending > 0" class="badge badge-sm">{{ statusCounts.pending }}</span>
                    </button>
                </div>
            </div>

            <!-- Advanced Search Panel -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div class="flex items-center justify-between border-b pb-3 border-gray-100">
                    <span class="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[20px] text-emerald-600">filter_alt</span>
                        Tra cứu / Bộ lọc nâng cao
                    </span>
                    <button @click="showAdvanced = !showAdvanced" class="btn btn-ghost btn-xs text-primary font-bold">
                        {{ showAdvanced ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc' }}
                    </button>
                </div>

                <div v-show="showAdvanced" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                    <!-- Date range -->
                    <div class="form-control">
                        <label class="label py-1"><span class="label-text font-semibold text-gray-600 text-xs">Từ ngày</span></label>
                        <input type="date" v-model="advStartDate" class="input input-bordered input-sm rounded-lg" />
                    </div>
                    <div class="form-control">
                        <label class="label py-1"><span class="label-text font-semibold text-gray-600 text-xs">Đến ngày</span></label>
                        <input type="date" v-model="advEndDate" class="input input-bordered input-sm rounded-lg" />
                    </div>

                    <!-- Price range -->
                    <div class="form-control">
                        <label class="label py-1"><span class="label-text font-semibold text-gray-600 text-xs">Giá trị từ (đ)</span></label>
                        <input type="number" v-model="advMinAmount" placeholder="Ví dụ: 100000" class="input input-bordered input-sm rounded-lg" />
                    </div>
                    <div class="form-control">
                        <label class="label py-1"><span class="label-text font-semibold text-gray-600 text-xs">Giá trị đến (đ)</span></label>
                        <input type="number" v-model="advMaxAmount" placeholder="Ví dụ: 2000000" class="input input-bordered input-sm rounded-lg" />
                    </div>

                    <!-- Payment Method -->
                    <div class="form-control">
                        <label class="label py-1"><span class="label-text font-semibold text-gray-600 text-xs">Phương thức thanh toán</span></label>
                        <select v-model="advPaymentMethod" class="select select-bordered select-sm rounded-lg">
                            <option value="">Tất cả phương thức</option>
                            <option value="COD">Thanh toán COD</option>
                            <option value="BANK_TRANSFER">Chuyển khoản</option>
                            <option value="VNPAY">Cổng VNPAY</option>
                            <option value="MOMO">Ví MoMo</option>
                        </select>
                    </div>

                    <!-- Payment Status -->
                    <div class="form-control">
                        <label class="label py-1"><span class="label-text font-semibold text-gray-600 text-xs">Trạng thái thanh toán</span></label>
                        <select v-model="advPaymentStatus" class="select select-bordered select-sm rounded-lg">
                            <option value="">Tất cả trạng thái</option>
                            <option value="unpaid">Chưa thanh toán</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="refunded">Đã hoàn tiền</option>
                        </select>
                    </div>

                    <!-- Actions -->
                    <div class="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-2 border-t pt-4 border-gray-100">
                        <button class="btn btn-ghost btn-sm rounded-lg text-gray-500 text-xs font-semibold" @click="resetAdvancedSearch">
                            🔄 Thiết lập lại
                        </button>
                        <button class="btn btn-primary btn-sm rounded-lg px-6 shadow-sm text-xs font-semibold text-white" @click="handleAdvancedSearch">
                            🔍 Tìm kiếm & Lọc
                        </button>
                    </div>
                </div>
            </div>

            <!-- Date Range Filter Panel (Quick Filter) -->
            <div v-show="!showAdvanced" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
                <span class="text-sm font-semibold text-gray-600">🗓 Lọc nhanh:</span>

                <div class="flex items-center gap-2 flex-wrap">
                    <button @click="dateFilterPeriod = 'all'" :class="['btn btn-xs rounded-lg', dateFilterPeriod === 'all' ? 'btn-primary' : 'btn-outline border-gray-300']">Tất cả</button>
                    <button @click="dateFilterPeriod = 'day'"     :class="['btn btn-xs rounded-lg', dateFilterPeriod === 'day'     ? 'btn-primary' : 'btn-outline border-gray-300']">Ngày</button>
                    <button @click="dateFilterPeriod = 'month'"   :class="['btn btn-xs rounded-lg', dateFilterPeriod === 'month'   ? 'btn-primary' : 'btn-outline border-gray-300']">Tháng</button>
                    <button @click="dateFilterPeriod = 'quarter'" :class="['btn btn-xs rounded-lg', dateFilterPeriod === 'quarter' ? 'btn-primary' : 'btn-outline border-gray-300']">Quý</button>
                    <button @click="dateFilterPeriod = 'year'"    :class="['btn btn-xs rounded-lg', dateFilterPeriod === 'year'    ? 'btn-primary' : 'btn-outline border-gray-300']">Năm</button>
                </div>

                <template v-if="dateFilterPeriod === 'day'">
                    <input type="date" v-model="filterDay" class="input input-bordered input-sm text-sm rounded-lg" />
                </template>

                <template v-if="dateFilterPeriod === 'month' || dateFilterPeriod === 'quarter' || dateFilterPeriod === 'year'">
                    <select v-model="filterYear" class="select select-bordered select-sm text-sm rounded-lg">
                        <option v-for="y in yearsRange" :key="y" :value="y">{{ y }}</option>
                    </select>
                </template>

                <template v-if="dateFilterPeriod === 'month'">
                    <select v-model="filterMonth" class="select select-bordered select-sm text-sm rounded-lg">
                        <option v-for="m in 12" :key="m" :value="m">Tháng {{ m }}</option>
                    </select>
                </template>

                <template v-if="dateFilterPeriod === 'quarter'">
                    <select v-model="filterMonth" class="select select-bordered select-sm text-sm rounded-lg">
                        <option :value="1">Quý I (T1–T3)</option>
                        <option :value="4">Quý II (T4–T6)</option>
                        <option :value="7">Quý III (T7–T9)</option>
                        <option :value="10">Quý IV (T10–T12)</option>
                    </select>
                </template>

                <div v-if="dateFilterPeriod !== 'all'" class="ml-auto text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span class="font-semibold text-gray-700">{{ filterPeriodLabel }}</span>:
                    <span class="text-gray-800 font-bold ml-1">{{ totalOrders }} đơn</span>
                    · DT: <span class="text-emerald-600 font-bold">{{ formatPrice(totalRevenue) }}</span>
                </div>
            </div>

            <!-- Delayed orders warning -->
            <div v-if="computedDelayedOrders.length > 0" class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md">
                <div class="flex items-center gap-3.5">
                    <div class="p-2.5 bg-white/20 rounded-xl shrink-0 backdrop-blur-sm shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base">Cảnh báo: Có {{ computedDelayedOrders.length }} đơn hàng chậm trễ!</h3>
                        <div class="text-xs text-red-100 mt-0.5">Vui lòng kiểm tra và xử lý gấp các đơn hàng đang chờ quá 1 ngày hoặc đang giao quá 3 ngày.</div>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0 flex-wrap self-end lg:self-center">
                    <button class="btn btn-sm bg-white/20 hover:bg-white/30 border-0 text-white font-medium rounded-lg px-3.5 backdrop-blur-sm whitespace-nowrap shadow-xs" @click="filterOnlyDelayedPending">
                        Xem đơn chờ
                    </button>
                    <button class="btn btn-sm bg-white text-red-700 hover:bg-red-50 border-0 font-bold rounded-lg px-3.5 whitespace-nowrap shadow-xs" @click="filterOnlyDelayedShipping">
                        Xem đơn đang giao
                    </button>
                    <button v-if="onlyShowDelayedPending || onlyShowDelayedShipping" class="btn btn-sm bg-black/20 hover:bg-black/30 border-0 text-white font-normal rounded-lg px-2.5 whitespace-nowrap" @click="handleFilterStatus('')">
                        ✕ Bỏ lọc
                    </button>
                </div>
            </div>

            <!-- Table -->
            <template v-if="orders.length > 0">
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table class="table w-full text-xs">
                        <thead class="bg-gray-50/80 text-gray-600 text-xs border-b border-gray-100">
                            <tr>
                                <th class="py-3.5 px-4 font-bold text-gray-700 whitespace-nowrap">Mã Đơn</th>
                                <th class="py-3.5 px-3 font-bold text-gray-700 whitespace-nowrap">Ngày đặt</th>
                                <th class="py-3.5 px-4 font-bold text-gray-700 min-w-[150px]">Khách Hàng</th>
                                <th class="py-3.5 px-4 font-bold text-gray-700 min-w-[190px]">Sản Phẩm</th>
                                <th class="py-3.5 px-4 font-bold text-gray-700 text-right whitespace-nowrap min-w-[120px]">Tổng Tiền</th>
                                <th class="py-3.5 px-4 font-bold text-gray-700 text-center whitespace-nowrap min-w-[160px]">Thanh Toán</th>
                                <th class="py-3.5 px-4 font-bold text-gray-700 text-center whitespace-nowrap min-w-[150px]">Trạng Thái</th>
                                <th class="py-3.5 px-3 font-bold text-gray-700 text-center whitespace-nowrap min-w-[100px]">NV xử lý</th>
                                <th class="py-3.5 px-4 font-bold text-gray-700 min-w-[185px]">Cập Nhật</th>
                                <th class="py-3.5 px-3 text-center w-12"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                            <tr v-for="order in displayedOrders" :key="order._id" class="hover:bg-slate-50/70 transition-colors">
                                <td class="py-3.5 px-4 font-mono text-[11px] font-bold text-gray-600 whitespace-nowrap align-middle">
                                    <span class="bg-gray-100 px-2 py-1 rounded-md text-gray-700 font-semibold border border-gray-200/60">
                                        #{{ (order.order_code || order._id.slice(-8)).toUpperCase() }}
                                    </span>
                                </td>
                                <td class="py-3.5 px-3 text-[11px] text-gray-500 whitespace-nowrap align-middle">
                                    {{ formatDate(order.order_date || order.createdAt) }}
                                </td>
                                <td class="py-3.5 px-4 align-middle">
                                    <div class="font-bold text-gray-800">{{ order.user_id?.first_name }} {{ order.user_id?.last_name }}</div>
                                    <div class="text-[11px] text-gray-400 font-mono mt-0.5">{{ order.phone_number }}</div>
                                </td>
                                <td class="py-3.5 px-4 align-middle">
                                    <div class="font-medium text-gray-800 truncate max-w-[200px]" :title="order.items && order.items.length > 0 ? order.items.map(i => i.product_id?.title).filter(Boolean).join(', ') : (order.product_id?.title || 'Sản phẩm')">
                                        {{ order.items && order.items.length > 0 ? (order.items[0].product_id?.title || 'Sản phẩm') : (order.product_id?.title || 'Sản phẩm') }}
                                    </div>
                                    <div class="text-[10px] font-semibold text-gray-400 mt-0.5 flex items-center gap-1">
                                        <span v-if="order.items && order.items.length > 1" class="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">+{{ order.items.length - 1 }} SP khác</span>
                                        <span>SL: x{{ order.items && order.items.length > 0 ? order.items.reduce((sum, i) => sum + (i.quantity || 1), 0) : (order.quantity || 1) }}</span>
                                    </div>
                                </td>
                                <td class="py-3.5 px-4 font-bold text-emerald-600 text-right whitespace-nowrap align-middle text-sm">
                                    {{ formatPrice(order.total_amount) }}
                                </td>
                                <td class="py-3.5 px-4 text-center align-middle">
                                    <div class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap" :class="paymentStatusClass(order.payment_status, order.payment_method, order.status)">
                                        {{ paymentStatusText(order.payment_status, order.payment_method, order.status) }}
                                    </div>
                                    <div class="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">{{ order.payment_method }}</div>
                                </td>
                                <td class="py-3.5 px-4 text-center align-middle">
                                    <div class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap" :class="statusClass(order.status)">
                                        {{ statusText(order.status) }}
                                    </div>
                                </td>
                                <td class="py-3.5 px-3 text-center text-[11px] text-gray-500 align-middle">
                                    <span v-if="order.staff_id" class="font-medium text-gray-700">{{ order.staff_id?.first_name || '' }} {{ order.staff_id?.last_name || '' }}</span>
                                    <span v-else class="text-gray-300 font-bold">—</span>
                                </td>
                                <td class="py-3.5 px-4 align-middle">
                                    <select
                                        :value="order.status"
                                        @change="updateOrderStatus(order, $event)"
                                        class="select select-bordered select-sm w-full min-w-[170px] text-xs font-semibold text-gray-700 bg-white shadow-2xs rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                                        :disabled="['completed', 'cancelled'].includes(order.status)"
                                    >
                                        <option v-for="s in getAvailableStatuses(order.status)" :key="s" :value="s">{{ statusText(s) }}</option>
                                    </select>
                                </td>
                                <td class="py-3.5 px-3 text-center align-middle">
                                    <button @click="openDetailModal(order)" class="btn btn-ghost btn-xs btn-circle hover:bg-gray-100" title="Xem chi tiết">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-4">
                    <button class="btn btn-sm btn-outline border-gray-300" :disabled="currentPage <= 1" @click="currentPage--">«</button>
                    <template v-for="(page, idx) in visiblePages" :key="idx">
                        <span v-if="page === '...'" class="px-2 text-gray-400 text-xs">...</span>
                        <button v-else class="btn btn-sm" :class="page === currentPage ? 'btn-primary text-white shadow-sm' : 'btn-outline border-gray-300'" @click="currentPage = page">{{ page }}</button>
                    </template>
                    <button class="btn btn-sm btn-outline border-gray-300" :disabled="currentPage >= totalPages" @click="currentPage++">»</button>
                </div>
            </template>

            <template v-else>
                <div class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <span class="text-5xl mb-4 opacity-40">📦</span>
                    <p class="text-xl font-medium text-gray-400">Không tìm thấy đơn hàng nào phù hợp</p>
                    <p class="text-sm text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            </template>

            <!-- Detail Modal -->
            <dialog :class="['modal', { 'modal-open': showDetailModal }]">
                <div class="modal-box max-w-2xl" v-if="selectedOrder">
                    <button @click="closeDetailModal" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    <h3 class="font-bold text-lg mb-4">Chi tiết đơn hàng #{{ (selectedOrder.order_code || selectedOrder._id.slice(-8)).toUpperCase() }}</h3>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-500 text-xs font-bold uppercase mb-1">Khách hàng</p>
                            <p class="font-bold">{{ selectedOrder.user_id?.first_name }} {{ selectedOrder.user_id?.last_name }}</p>
                            <p class="text-gray-500">{{ selectedOrder.phone_number }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 text-xs font-bold uppercase mb-1">Địa chỉ giao hàng</p>
                            <p class="font-medium">{{ formatAddress(selectedOrder.shipping_address) }}</p>
                        </div>
                        <div class="col-span-2 border-t border-b py-3 my-2 bg-gray-50/50 p-3 rounded-lg">
                            <p class="text-gray-500 text-xs font-bold uppercase mb-2">Danh sách sản phẩm trong đơn</p>
                            <div class="space-y-2">
                                <div v-for="item in selectedOrder.items || [selectedOrder]" :key="item._id" class="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-xs">
                                    <div>
                                        <p class="font-bold text-gray-800">{{ item.product_id?.title || selectedOrder.product_id?.title || 'Sản phẩm' }}</p>
                                        <p v-if="item.variant_id" class="text-[10px] text-gray-500 mt-0.5">
                                            Phân loại: <span v-for="attr in item.variant_id.attributes" :key="attr.name">{{ attr.name }}: {{ attr.value }} </span>
                                        </p>
                                    </div>
                                    <div class="text-right shrink-0">
                                        <p class="font-bold text-gray-700">{{ formatPrice(item.price_at_purchase || selectedOrder.price_at_purchase) }}</p>
                                        <p class="text-[10px] text-gray-400">Số lượng: {{ item.quantity || selectedOrder.quantity || 1 }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p class="text-gray-500 text-xs font-bold uppercase mb-1">Thanh toán</p>
                            <p class="font-bold text-emerald-600">{{ formatPrice(selectedOrder.total_amount) }}</p>
                            <div class="flex flex-wrap gap-2 mt-1 items-center">
                                <span class="badge badge-sm" :class="paymentStatusClass(selectedOrder.payment_status, selectedOrder.payment_method, selectedOrder.status)">
                                    {{ paymentStatusText(selectedOrder.payment_status, selectedOrder.payment_method, selectedOrder.status) }}
                                </span>
                                <span class="badge badge-sm badge-ghost font-bold">{{ selectedOrder.payment_method }}</span>
                                <button
                                    v-if="selectedOrder.payment_method !== 'COD' && selectedOrder.payment_status !== 'paid' && ['BANK_TRANSFER', 'VIETQR'].includes(selectedOrder.payment_method)"
                                    @click="confirmPayment(selectedOrder)"
                                    class="btn btn-xs btn-success text-white font-bold"
                                >Xác nhận đã nhận CK</button>
                                <span v-else-if="selectedOrder.payment_method === 'COD'" class="text-[11px] text-sky-700 font-semibold italic">
                                    (Shipper thu tiền mặt khi giao)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedOrder.note" class="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <p class="text-xs font-bold text-amber-600 mb-1">📝 Ghi chú</p>
                        <p class="text-sm text-gray-700">{{ selectedOrder.note }}</p>
                    </div>

                    <div v-if="selectedOrder.tracking_number" class="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p class="text-xs font-bold text-blue-600 mb-1">📦 Mã vận chuyển</p>
                        <p class="font-mono text-blue-800 font-bold">{{ selectedOrder.tracking_number }}</p>
                    </div>

                    <!-- Tracking Timeline -->
                    <div v-if="selectedOrder.tracking_history?.length > 0" class="mt-4 text-left">
                        <p class="text-xs font-bold text-gray-500 uppercase mb-3">Lịch sử vận chuyển</p>
                        <div class="space-y-3 pl-2">
                            <div v-for="(entry, index) in [...selectedOrder.tracking_history].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))"
                                 :key="index" class="flex gap-3">
                                <div class="flex flex-col items-center">
                                    <div :class="['w-2.5 h-2.5 rounded-full shrink-0', index === 0 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-300']"></div>
                                    <div v-if="index < selectedOrder.tracking_history.length - 1" class="w-0.5 flex-1 bg-gray-200 mt-1"></div>
                                </div>
                                <div class="-mt-0.5">
                                    <p class="text-xs font-bold" :class="index === 0 ? 'text-emerald-600' : 'text-gray-500'">{{ statusText(entry.status) }}</p>
                                    <p class="text-xs text-gray-500">{{ entry.description }}</p>
                                    <p class="text-[10px] text-gray-400">{{ formatDate(entry.timestamp) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 text-xs text-gray-400 border-t pt-3">
                        <p>Ngày đặt: {{ formatDate(selectedOrder.order_date || selectedOrder.createdAt) }}</p>
                        <p v-if="selectedOrder.staff_id">NV xử lý: {{ selectedOrder.staff_id?.first_name }} {{ selectedOrder.staff_id?.last_name }}</p>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop" @click="closeDetailModal">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    </AdminLayout>
</template>

<style scoped>
.status-badge {
    background-color: #ecfdf5 !important;
    color: #065f46 !important;
    border: 1px solid #a7f3d0 !important;
    font-weight: 600 !important;
}
</style>