<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import OrderCard from "../components/OrderCard.vue";

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from "vue-router";
import { push } from "notivue";
import OrderService from "../services/order.service";
import ApiClient from "../services/api.service";

const router = useRouter();
const orderService = new OrderService();
const api = ApiClient();
const role = computed(() => localStorage.getItem("role"));
const id = computed(() => localStorage.getItem("id"));

const orders = ref([]);
const searchText = ref("");
const filteredStatus = ref("");
const isRefreshing = ref(false);
let refreshInterval = null;

const fetchOrders = async (silent = false) => {
    if (!silent) isRefreshing.value = true;
    try {
        const res = await orderService.getAllOrders({ user_id: id.value });
        orders.value = Array.isArray(res) ? res : (res?.orders || []);
    } catch (error) {
        console.error("Lỗi lấy danh sách đơn hàng:", error);
    } finally {
        if (!silent) isRefreshing.value = false;
    }
};

const handleManualRefresh = async () => {
    await fetchOrders(false);
    push.success("Đã đồng bộ đơn hàng mới nhất!");
};

const handleFilterStatus = (status) => {
    filteredStatus.value = status;
    fetchOrders(true);
};

const filteredOrders = computed(() => {
    let result = Array.isArray(orders.value) ? orders.value : [];

    if (filteredStatus.value) {
        if (filteredStatus.value === 'unpaid') {
            result = result.filter(order =>
                ['unpaid', 'verifying'].includes(order.payment_status) &&
                ['VNPAY', 'VIETQR', 'BANK_TRANSFER'].includes(order.payment_method)
            );
        } else {
            result = result.filter(order => order.status === filteredStatus.value);
        }
    }

    if (searchText.value && searchText.value.trim() !== "") {
        const keyword = searchText.value.trim().toLowerCase();
        result = result.filter(order => {
            const itemTitles = order.items ? order.items.map(i => i.product_id?.title).filter(Boolean).join(' ') : '';
            const searchableText = [
                order._id,
                order.order_code,
                order.product_id?.title,
                itemTitles,
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

const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
        fetchOrders(true);
    }
};

onMounted(async () => {
    fetchOrders();
    fetchGameConfig();

    // Auto-polling every 10 seconds to sync status changes from Admin
    refreshInterval = setInterval(() => {
        fetchOrders(true);
    }, 10000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
});

// Coin Toss Game variables
const showTossModal = ref(false);
const selectedOrder = ref(null);
const tossStatus = ref("idle"); // 'idle' | 'tossing' | 'won' | 'lost'
const tossResult = ref(""); // 'HEADS' | 'TAILS'
const winPromoCode = ref("");

// Game settings & Stats config
const gameLimitHours = ref(24);
const gameLimitTries = ref(1);
const gameActive = ref(true);
const totalTossesCount = ref(0);
const totalWinsCount = ref(0);

const fetchGameConfig = async () => {
    try {
        const res = await api.get("/api/setting/coin_toss_game_config");
        if (res.data && res.data.gia_tri) {
            const config = res.data.gia_tri;
            gameLimitHours.value = config.limit_hours || 24;
            gameLimitTries.value = config.limit_tries || 1;
            gameActive.value = config.active !== false;
        }
    } catch (err) {
        console.log("No custom coin toss game config found, using defaults.");
    }
    // Fetch stats
    try {
        const resStats = await api.get("/api/user/points/history");
        const allLogs = resStats.data || [];
        const myTosses = allLogs.filter(log => log.user_id === id.value && log.description.includes("tung xu"));
        totalTossesCount.value = myTosses.length;
        totalWinsCount.value = myTosses.filter(log => log.description.includes("Thắng")).length;
    } catch (e) {
        console.error(e);
    }
};

const eligibleOrderForToss = computed(() => {
    // Buy 1 order -> get 1 toss. Filter orders that are delivered or completed, not cancelled, and where coin_toss_eligible is true
    return orders.value.find(order => 
        (order.status === 'delivered' || order.status === 'completed') && 
        order.coin_toss_eligible !== false
    );
});

const openTossModal = (order) => {
    if (!gameActive.value) {
        push.warning("Game Tung Xu hiện đang tạm đóng bởi quản trị viên!");
        return;
    }
    selectedOrder.value = order;
    tossStatus.value = "idle";
    tossResult.value = "";
    winPromoCode.value = "";
    showTossModal.value = true;
};

const rollTossVoucher = async () => {
    if (tossStatus.value === "tossing") return;
    tossStatus.value = "tossing";

    // Simulate coin spinning delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const coinSide = Math.random() > 0.5 ? "HEADS" : "TAILS";
    tossResult.value = coinSide;

    if (coinSide === "HEADS") {
        tossStatus.value = "won";
        try {
            const randomCode = "LUCKYCOIN" + Math.floor(1000 + Math.random() * 9000);
            winPromoCode.value = randomCode;

            // 1. Create Promotion
            await api.post("/api/promotion", {
                code: randomCode,
                name: `Tung Xu Order - ${localStorage.getItem("username") || "Khách"}`,
                discount_type: "fixed_amount",
                discount_value: 50000,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                min_order_value: 150000,
                usage_limit: 1,
                status: "active"
            });

            // 2. Adjust points
            await api.post("/api/user/points/adjust", {
                user_id: id.value,
                type: "ADJUST",
                amount: 20,
                reason: `Thắng game tung xu: Nhận 20 Xu & Voucher 50k (${randomCode})`
            });

            // 3. Mark order as ineligible for further tosses
            await api.put(`/api/order/${selectedOrder.value._id}`, {
                coin_toss_eligible: false
            });

            push.success(`Chúc mừng! Nhận được mặt sấp HEADS. Nhận Voucher ${randomCode} & +20 Xu`);
            fetchOrders();
            fetchGameConfig();
        } catch (e) {
            console.error(e);
            push.error("Lỗi khi đồng bộ phần thưởng game");
        }
    } else {
        tossStatus.value = "lost";
        try {
            // Mark order as ineligible even on loss (1 try limit per order)
            await api.put(`/api/order/${selectedOrder.value._id}`, {
                coin_toss_eligible: false
            });
            // Adjust points - write history of playing
            await api.post("/api/user/points/adjust", {
                user_id: id.value,
                type: "ADJUST",
                amount: 0,
                reason: "Thua game tung xu: Mặt ngửa TAILS"
            });
            fetchOrders();
            fetchGameConfig();
        } catch (err) {
            console.error(err);
        }
        push.info("Mặt ngửa TAILS - Chúc bạn may mắn lần sau!");
    }
};
</script>

<template>
    <div class="flex flex-col min-h-screen overflow-hidden bg-slate-50">
        <Header></Header>
        <div class="flex-grow mx-4 sm:mx-8 lg:mx-auto lg:max-w-7xl my-8 w-full self-center">
            
            <!-- Đổi sang dạng Tabs ngang như Shopee -->
            <div class="flex flex-col xl:flex-row gap-4 justify-between items-center mb-8 w-full bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100">
                <div class="flex overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-hide gap-2 items-center">
                    <button @click="handleFilterStatus('')" 
                        class="px-5 py-2.5 whitespace-nowrap rounded-full text-sm font-extrabold transition-all border-2"
                        :class="filteredStatus === '' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-transparent border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-500'">
                        Tất cả
                    </button>
                    <button @click="handleFilterStatus('unpaid')" 
                        class="px-5 py-2.5 whitespace-nowrap rounded-full text-sm font-extrabold transition-all border-2"
                        :class="filteredStatus === 'unpaid' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-transparent border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-500'">
                        Chờ thanh toán (VNPAY)
                    </button>
                    <button @click="handleFilterStatus('pending')" 
                        class="px-5 py-2.5 whitespace-nowrap rounded-full text-sm font-extrabold transition-all border-2"
                        :class="filteredStatus === 'pending' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-transparent border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-500'">
                        Chờ xác nhận
                    </button>
                    <button @click="handleFilterStatus('confirmed')" 
                        class="px-5 py-2.5 whitespace-nowrap rounded-full text-sm font-extrabold transition-all border-2"
                        :class="filteredStatus === 'confirmed' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-transparent border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-500'">
                        Đang chuẩn bị
                    </button>
                    <button @click="handleFilterStatus('shipping')" 
                        class="px-5 py-2.5 whitespace-nowrap rounded-full text-sm font-extrabold transition-all border-2"
                        :class="filteredStatus === 'shipping' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-transparent border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-500'">
                        Đang vận chuyển
                    </button>
                    <button @click="handleFilterStatus('delivered')" 
                        class="px-5 py-2.5 whitespace-nowrap rounded-full text-sm font-extrabold transition-all border-2"
                        :class="filteredStatus === 'delivered' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-transparent border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-500'">
                        Đã giao
                    </button>
                    <button @click="handleFilterStatus('completed')" 
                        class="px-5 py-2.5 whitespace-nowrap rounded-full text-sm font-extrabold transition-all border-2"
                        :class="filteredStatus === 'completed' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-transparent border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-500'">
                        Hoàn tất
                    </button>
                    <button @click="handleFilterStatus('cancelled')" 
                        class="px-5 py-2.5 whitespace-nowrap rounded-full text-sm font-extrabold transition-all border-2"
                        :class="filteredStatus === 'cancelled' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-transparent border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-500'">
                        Đã hủy
                    </button>
                </div>

                <div class="flex items-center gap-2 w-full xl:w-auto shrink-0">
                    <div class="w-full xl:w-72 relative">
                        <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        <input type="text" v-model="searchText" placeholder="Tìm mã đơn hoặc tên SP..." class="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
                    </div>
                    <button 
                        @click="handleManualRefresh" 
                        :disabled="isRefreshing" 
                        title="Làm mới danh sách đơn hàng"
                        class="p-2.5 bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200 rounded-full transition-all flex items-center justify-center shrink-0 disabled:opacity-60 cursor-pointer shadow-2xs">
                        <svg class="w-5 h-5 transition-transform duration-500" :class="{ 'animate-spin text-orange-500': isRefreshing }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- TOSS COIN ELIGIBLE BANNER & STATS -->
            <div v-if="eligibleOrderForToss" class="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                <div class="space-y-1 text-left">
                    <h3 class="font-extrabold text-sm text-amber-900 flex items-center gap-1.5">
                        <span>🪙 Bạn có lượt tung xu nhận quà!</span>
                        <span class="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black uppercase">Đơn hàng mới</span>
                    </h3>
                    <p class="text-slate-600 font-medium">Bạn đã hoàn thành đơn hàng <strong>#{{ (eligibleOrderForToss.order_code || eligibleOrderForToss._id.slice(-8)).toUpperCase() }}</strong>. Mỗi đơn hàng hoàn thành được nhận 1 lượt tung xu trúng Voucher 50k & 20 Xu tích lũy!</p>
                    <div class="text-[10px] text-slate-400 font-semibold flex gap-3 pt-1">
                        <span>📊 Tổng số lượt đã tung: <strong>{{ totalTossesCount }}</strong></span>
                        <span>🏆 Số lần thắng: <strong>{{ totalWinsCount }}</strong></span>
                    </div>
                </div>
                <button @click="openTossModal(eligibleOrderForToss)" class="btn bg-amber-500 hover:bg-amber-600 text-amber-950 border-none font-bold rounded-xl px-6 shrink-0 shadow-md">
                    🪙 Tung Xu Ngay
                </button>
            </div>

            <template v-if="filteredOrders.length > 0">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <OrderCard v-for="order in filteredOrders" :key="order._id" :order="order"
                        @fetchOrders="fetchOrders">
                    </OrderCard>
                </div>
            </template>
            <template v-else>
                <div class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <span class="text-6xl mb-4 opacity-50">🛒</span>
                    <p class="font-extrabold text-slate-500 text-lg">Chưa có đơn hàng nào ở mục này</p>
                </div>
            </template>
        </div>

        <!-- TOSS COIN GAME MODAL FOR CUSTOMER -->
        <div v-if="showTossModal && selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-xs">
            <div class="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-left relative">
                <button @click="showTossModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-gray-600 text-xl font-bold">✕</button>
                
                <h3 class="text-lg font-black text-slate-800 mb-1">🪙 Vòng Quay May Mắn: Tung Xu Nhận Quà</h3>
                <p class="text-slate-500 mb-4">Bạn đang thực hiện lượt tung xu cho đơn hàng <strong>#{{ (selectedOrder.order_code || selectedOrder._id.slice(-8)).toUpperCase() }}</strong>.</p>
                
                <div class="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <!-- Coin Graphic -->
                    <div class="relative w-20 h-20 rounded-full bg-amber-400 border-4 border-amber-500 flex items-center justify-center shadow-lg font-black text-amber-900 text-lg select-none"
                         :class="{ 'animate-bounce': tossStatus === 'tossing' }">
                        <span v-if="tossStatus === 'idle'">🪙</span>
                        <span v-else-if="tossStatus === 'tossing'">🌀</span>
                        <span v-else-if="tossResult === 'HEADS'">SẤP</span>
                        <span v-else>NGỬA</span>
                    </div>
                    
                    <p class="font-bold text-center text-slate-700">
                        <span v-if="tossStatus === 'idle'">Nhấn nút để bắt đầu tung đồng xu!</span>
                        <span v-else-if="tossStatus === 'tossing'">Đồng xu đang xoay trong không trung...</span>
                        <span v-else-if="tossStatus === 'won'" class="text-emerald-600">Tuyệt vời! Mặt SẤP (HEADS) 🎉</span>
                        <span v-else-if="tossStatus === 'lost'" class="text-red-500">Mặt NGỬA (TAILS) - Tiếc quá, hẹn bạn lần sau!</span>
                    </p>
                    
                    <div v-if="tossStatus === 'won'" class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center w-5/6">
                        <p class="font-bold text-emerald-800">🎁 Phần quà của bạn: Voucher 50k!</p>
                        <p class="font-mono text-sm bg-white border border-emerald-300 py-1.5 px-3 rounded-lg mt-1 select-all font-black text-slate-800 text-center tracking-widest">{{ winPromoCode }}</p>
                        <p class="text-[10px] text-emerald-600 mt-1">Hệ thống đã tự động cộng thêm +20 Xu vào ví tích lũy của bạn.</p>
                    </div>
                </div>
                
                <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                    <button type="button" @click="showTossModal = false" class="btn btn-ghost btn-sm rounded-xl">Đóng</button>
                    <button 
                        v-if="tossStatus === 'idle'"
                        type="button" 
                        @click="rollTossVoucher" 
                        class="btn bg-amber-500 hover:bg-amber-600 text-amber-950 border-none btn-sm rounded-xl px-6 font-bold"
                    >
                        Tung Ngay
                    </button>
                </div>
            </div>
        </div>

        <Footer></Footer>
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>