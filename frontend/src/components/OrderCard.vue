<script setup>
import { useRouter } from "vue-router";
import { ref, computed } from 'vue';
import OrderService from "../services/order.service";
import PaymentService from "../services/payment.service";
import { push } from "notivue";

const role = computed(() => (localStorage.getItem("role") || "").toUpperCase());
const staff_id = computed(() => localStorage.getItem("id"));
const router = useRouter();
const orderService = new OrderService();
const paymentService = new PaymentService();
const emit = defineEmits(["fetchOrders"]);

const props = defineProps({
    order: {
        type: Object,
        required: true
    }
});

const loading = ref(true);
const trackingInput = ref(props.order.tracking_number || "");
const showTimeline = ref(false);

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

const formatAddress = (addr) => {
    if (!addr) return '---';
    if (typeof addr === 'string') return addr;
    if (addr.addressDetail) {
        return `${addr.addressDetail}${addr.wardName ? ', ' + addr.wardName : ''}${addr.districtName ? ', ' + addr.districtName : ''}${addr.provinceName ? ', ' + addr.provinceName : ''}`;
    }
    return '---';
};

const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const paymentMethodText = (method) => {
    switch (method) {
        case 'COD': return 'Thanh toán khi nhận hàng';
        case 'BANK_TRANSFER': return 'Chuyển khoản ngân hàng';
        case 'VIETQR': return 'Chuyển khoản VietQR';
        case 'VNPAY': return 'Ví điện tử VNPAY';
        case 'MOMO': return 'Ví MoMo';
        default: return 'Không xác định';
    }
};

const paymentMethodIcon = (method) => {
    switch (method) {
        case 'COD': return '💵';
        case 'BANK_TRANSFER': return '🏦';
        case 'VIETQR': return '📲';
        case 'VNPAY': return '💳';
        case 'MOMO': return '📱';
        default: return '💳';
    }
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
        case 'unpaid': return '⏳ Chờ thanh toán';
        case 'verifying': return '🔍 Đang kiểm tra CK';
        case 'refunded': return '💰 Đã hoàn tiền';
        case 'expired': return '⚠️ Hết hạn';
        default: return 'Chưa thanh toán';
    }
};

const paymentStatusClass = (status, payment_method, order_status) => {
    if (payment_method === 'COD') {
        if (status === 'paid' || order_status === 'delivered' || order_status === 'completed') {
            return 'bg-emerald-50 text-emerald-800 border border-emerald-200/90';
        }
        return 'bg-sky-50 text-sky-800 border border-sky-200/90';
    }
    switch (status) {
        case 'paid': return 'bg-emerald-50 text-emerald-800 border border-emerald-200/90';
        case 'verifying': return 'bg-amber-50 text-amber-900 border border-amber-300 animate-pulse';
        case 'refunded': return 'bg-teal-50 text-teal-800 border border-teal-200/90';
        case 'expired': return 'bg-rose-50 text-rose-800 border border-rose-200/90';
        default: return 'bg-amber-50 text-amber-800 border border-amber-200/90';
    }
};

const statusText = (status) => {
    switch (status) {
        case 'pending': return 'Chờ xác nhận';
        case 'confirmed': return 'Đã xác nhận';
        case 'shipping': return 'Đang vận chuyển';
        case 'delivered': return 'Đã nhận hàng';
        case 'completed': return 'Đã hoàn tất';
        case 'return_requested': return 'Chờ duyệt hoàn hàng';
        case 'returning': return 'Đang chuyển hoàn';
        case 'returned': return 'Đã nhận hàng hoàn';
        case 'refunded': return 'Đã hoàn tiền';
        case 'cancelled': return 'Đã hủy';
        default: return 'Không xác định';
    }
};

const statusBadgeClass = (status) => {
    switch (status) {
        case 'pending': return 'bg-amber-50 text-amber-800 border-amber-200/80';
        case 'confirmed': return 'bg-blue-50 text-blue-800 border-blue-200/80';
        case 'shipping': return 'bg-purple-50 text-purple-800 border-purple-200/80';
        case 'delivered': return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
        case 'completed': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
        case 'return_requested': return 'bg-orange-50 text-orange-800 border-orange-200/80';
        case 'returning': return 'bg-purple-50 text-purple-800 border-purple-200/80';
        case 'returned': return 'bg-slate-100 text-slate-800 border-slate-300';
        case 'refunded': return 'bg-teal-50 text-teal-800 border-teal-200/80';
        case 'cancelled': return 'bg-rose-50 text-rose-800 border-rose-200/80';
        default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
};

const statusDotClass = (status) => {
    switch (status) {
        case 'pending': return 'bg-amber-500';
        case 'confirmed': return 'bg-blue-500';
        case 'shipping': return 'bg-purple-500';
        case 'delivered': return 'bg-emerald-500';
        case 'completed': return 'bg-emerald-600';
        case 'cancelled': return 'bg-rose-500';
        default: return 'bg-slate-400';
    }
};

const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipping', 'cancelled'],
    shipping: ['delivered'],
    delivered: [],
    completed: [],
    cancelled: [],
};

const canTransitionTo = (targetStatus) => {
    const allowed = validTransitions[props.order.status] || [];
    return allowed.includes(targetStatus);
};

const updateStatus = async (status) => {
    try {
        if (status === 'cancelled' && !confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) {
            return;
        }
        const payload = { status, staff_id: staff_id.value };
        if (status === 'shipping' && trackingInput.value) {
            payload.tracking_number = trackingInput.value;
        }
        await orderService.updateOrder(props.order._id, payload);
        push.success(`Cập nhật trạng thái: ${statusText(status)} thành công`);
        emit("fetchOrders");
    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái';
        push.error(msg);
    }
};

const updatePaymentStatus = async () => {
    try {
        await paymentService.adminConfirmPayment(props.order._id, { note: 'Admin xác nhận thủ công' });
        push.success('Đã xác nhận thanh toán thành công');
        emit('fetchOrders');
    } catch (error) {
        const msg = error.response?.data?.message || 'Lỗi khi cập nhật thanh toán';
        push.error(msg);
    }
};

const deleteOrder = async () => {
    if (confirm("Xác nhận xóa đơn hàng này?")) {
        try {
            await orderService.deleteOrder(props.order._id);
            push.info("Đã xóa đơn hàng");
            emit("fetchOrders");
        } catch (error) {
            push.error("Lỗi khi xóa đơn hàng");
        }
    }
};

const sortedHistory = computed(() => {
    if (!props.order.tracking_history) return [];
    return [...props.order.tracking_history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

const buyAgain = () => {
    if (!props.order.product_id?._id) { push.error('Không tìm thấy sản phẩm'); return; }
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = savedCart.find(i => i.product._id === props.order.product_id._id && !i.variant_id);
    if (existing) {
        existing.quantity += props.order.quantity || 1;
    } else {
        savedCart.push({
            product: {
                _id: props.order.product_id._id,
                title: props.order.product_id.title,
                image: props.order.product_id.image,
                images: props.order.product_id.images,
                price: props.order.product_id.price,
                flash_sale_price: props.order.product_id.flash_sale_price,
            },
            quantity: props.order.quantity || 1,
            variant_id: props.order.variant_id?._id || undefined,
            variant: props.order.variant_id || null,
        });
    }
    localStorage.setItem('cart', JSON.stringify(savedCart));
    push.success('Đã thêm vào giỏ hàng!');
    router.push('/cart');
};

const printInvoice = () => {
    const order = props.order;
    const productTitle = order.product_id?.title || 'Sản phẩm';
    const total = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount || 0);
    const date = new Date(order.createdAt).toLocaleString('vi-VN');
    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Hóa đơn #${order._id.slice(-8).toUpperCase()}</title>
        <style>body{font-family:Arial,sans-serif;padding:32px;max-width:480px;margin:auto}
        h1{font-size:20px;border-bottom:2px solid #333;padding-bottom:8px}
        .row{display:flex;justify-content:space-between;margin:8px 0;font-size:14px}
        .total{font-weight:bold;font-size:16px;border-top:2px solid #333;padding-top:8px;margin-top:8px}
        .badge{background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:99px;font-size:12px}</style></head>
        <body>
        <h1>🧴 Hóa đơn đơn hàng</h1>
        <div class="row"><span>Mã đơn:</span><strong>#${order._id.slice(-8).toUpperCase()}</strong></div>
        <div class="row"><span>Ngày đặt:</span><span>${date}</span></div>
        <div class="row"><span>Sản phẩm:</span><span>${productTitle}</span></div>
        <div class="row"><span>Số lượng:</span><span>${order.quantity || 1}</span></div>
        <div class="row"><span>Thanh toán:</span><span class="badge">${order.payment_method}</span></div>
        <div class="row"><span>Địa chỉ:</span><span>${order.shipping_address}</span></div>
        <div class="row total"><span>Tổng tiền:</span><span>${total}</span></div>
        ${order.note ? `<div class="row"><span>Ghi chú:</span><span>${order.note}</span></div>` : ''}
        <p style="margin-top:24px;font-size:12px;color:#999">Cảm ơn bạn đã mua hàng!</p>
        <script>window.print();<\/script>
        </body></html>`);
    win.document.close();
};

const isPaying = ref(false);
const payNow = async () => {
    try {
        isPaying.value = true;
        const res = await paymentService.createVnpayUrl({
            amount: props.order.total_amount,
            order_id: props.order._id
        });
        if (res?.payment_url) {
            window.location.href = res.payment_url;
        } else {
            push.error("Không thể tạo liên kết thanh toán");
        }
    } catch (err) {
        console.error(err);
        push.error("Đã xảy ra lỗi khi kết nối với cổng thanh toán");
    } finally {
        isPaying.value = false;
    }
};

const reviewProduct = () => {
    if (props.order.product_id?._id) {
        router.push({ path: `/products/${props.order.product_id._id}`, hash: '#reviews' });
    }
};

const getStepClass = (stepName) => {
    const status = props.order.status;
    if (status === 'cancelled') {
        return stepName === 'pending' || stepName === 'cancelled' ? 'step-primary step-error font-bold' : 'opacity-40';
    }
    const steps = ['pending', 'confirmed', 'shipping', 'delivered', 'completed'];
    const currentIdx = steps.indexOf(status);
    const stepIdx = steps.indexOf(stepName);
    if (stepIdx === currentIdx) {
        return 'step-primary font-bold';
    }
    return stepIdx < currentIdx ? 'step-primary font-bold' : '';
};
</script>

<template>
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden h-full text-left group">
        <!-- TOP IMAGE & BADGES HEADER -->
        <div>
            <div class="relative h-44 w-full bg-slate-50 overflow-hidden border-b border-slate-100">
                <div v-if="loading" class="skeleton absolute inset-0 w-full h-full"></div>
                <img referrerpolicy="no-referrer" 
                     :src="props.order.variant_id?.image || props.order.product_id?.image || `/images/product-missing.svg`" 
                     @load="loading = false"
                     @error="loading = false"
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                     :class="{'opacity-0': loading}" 
                     alt="Ảnh sản phẩm" />
                
                <!-- Order Code Badge (Top-Left) -->
                <div class="absolute top-2.5 left-2.5 z-10">
                    <span class="font-mono text-[11px] font-bold text-slate-800 bg-white/95 px-2.5 py-1 rounded-lg shadow-2xs border border-slate-200/80 backdrop-blur-xs">
                        #{{ (props.order.order_code || props.order._id.slice(-8)).toUpperCase() }}
                    </span>
                </div>

                <!-- Order Status Badge (Top-Right: Compact, No Stretch, High Contrast) -->
                <div class="absolute top-2.5 right-2.5 z-10">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-2xs border backdrop-blur-md"
                          :class="statusBadgeClass(props.order.status)">
                        <span class="w-1.5 h-1.5 rounded-full" :class="statusDotClass(props.order.status)"></span>
                        <span>{{ statusText(props.order.status) }}</span>
                    </span>
                </div>
            </div>

            <!-- CARD MAIN CONTENT -->
            <div class="p-4 space-y-3.5">
                <!-- Title & Variants -->
                <div>
                    <h3 class="font-bold text-sm text-slate-800 line-clamp-2 min-h-[38px] leading-snug group-hover:text-emerald-700 transition-colors" 
                        :title="props.order.product_id?.title">
                        {{ props.order.product_id?.title || 'Sản phẩm' }}
                        <span v-if="props.order.items && props.order.items.length > 1" class="text-xs font-medium text-emerald-700 ml-1">
                            (+{{ props.order.items.length - 1 }} sản phẩm khác)
                        </span>
                    </h3>
                    <div v-if="props.order.variant_id && (!props.order.items || props.order.items.length <= 1)" 
                         class="text-[11px] text-slate-500 font-medium bg-slate-100 rounded-md px-2 py-0.5 inline-block mt-1.5 border border-slate-200/60">
                        Phân loại: <span v-for="attr in props.order.variant_id.attributes" :key="attr.name" class="font-semibold text-slate-700">{{ attr.name }}: {{ attr.value }} </span>
                    </div>
                </div>

                <!-- Order Details Meta -->
                <div class="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div class="flex items-center justify-between text-slate-500">
                        <span>Ngày đặt hàng:</span>
                        <span class="font-medium text-slate-700">{{ formatDate(props.order.order_date || props.order.createdAt) }}</span>
                    </div>
                    <div class="flex items-start justify-between gap-2 text-slate-500">
                        <span class="shrink-0">Địa chỉ nhận:</span>
                        <span class="font-medium text-slate-700 text-right line-clamp-1" :title="formatAddress(props.order.shipping_address)">
                            {{ formatAddress(props.order.shipping_address) }}
                        </span>
                    </div>
                    <div class="flex items-center justify-between text-slate-500">
                        <span>Số điện thoại:</span>
                        <span class="font-mono font-medium text-slate-700">{{ props.order.phone_number }}</span>
                    </div>
                    <div class="flex items-center justify-between pt-1 border-t border-dashed border-slate-100">
                        <span class="text-slate-600 font-medium">Tổng thanh toán:</span>
                        <span class="font-extrabold text-base text-emerald-700 flex items-center gap-1">
                            {{ formatPrice(props.order.total_amount || 0) }}
                            <span v-if="props.order.items && props.order.items.length > 1" class="text-[11px] font-semibold text-slate-400">({{ props.order.items.length }} SP)</span>
                            <span v-else class="text-[11px] font-semibold text-slate-400">(x{{ props.order.quantity || 1 }})</span>
                        </span>
                    </div>
                </div>

                <!-- Multi-item list preview (if any) -->
                <div v-if="props.order.items && props.order.items.length > 1" class="space-y-1.5 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                    <p class="font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1">Danh sách sản phẩm:</p>
                    <div v-for="item in props.order.items" :key="item._id" class="flex justify-between text-slate-700 items-start gap-2">
                        <span class="truncate max-w-[170px]" :title="item.product_id?.title">• {{ item.product_id?.title }}</span>
                        <span class="shrink-0 font-semibold text-slate-400">x{{ item.quantity || 1 }}</span>
                    </div>
                </div>

                <!-- Note / Tracking Number Blocks -->
                <div v-if="props.order.note" class="bg-amber-50/80 rounded-xl p-2.5 border border-amber-100 text-xs">
                    <span class="text-amber-800 font-bold block mb-0.5">📝 Ghi chú:</span>
                    <span class="text-slate-700">{{ props.order.note }}</span>
                </div>
                <div v-if="props.order.tracking_number" class="flex justify-between items-center p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 text-xs">
                    <span class="text-blue-800 font-semibold">Mã vận chuyển:</span>
                    <span class="font-mono text-blue-900 font-bold">{{ props.order.tracking_number }}</span>
                </div>

                <!-- PAYMENT SECTION (CLEAR HIERARCHY: METHOD & STATUS) -->
                <div class="bg-slate-50/90 rounded-xl p-3 border border-slate-200/70 space-y-2 text-xs">
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Phương thức:</span>
                        <div class="flex items-center gap-1.5 font-semibold text-slate-700 text-right">
                            <span>{{ paymentMethodIcon(props.order.payment_method) }}</span>
                            <span class="truncate max-w-[130px]" :title="paymentMethodText(props.order.payment_method)">{{ paymentMethodText(props.order.payment_method) }}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
                        <span class="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Trạng thái:</span>
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs w-fit shrink-0" 
                              :class="paymentStatusClass(props.order.payment_status, props.order.payment_method, props.order.status)">
                            {{ paymentStatusText(props.order.payment_status, props.order.payment_method, props.order.status) }}
                        </span>
                    </div>
                </div>

                <!-- TRACKING TIMELINE TOGGLE -->
                <div class="pt-1">
                    <button @click="showTimeline = !showTimeline" 
                            type="button"
                            class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/60 transition-all duration-200 cursor-pointer">
                        <span class="flex items-center gap-2">
                            <span>🚚</span>
                            <span>Chi tiết vận chuyển</span>
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200 text-slate-400" 
                             :class="{ 'rotate-180 text-emerald-700': showTimeline }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    <!-- Expandable Timeline Content -->
                    <transition name="accordion">
                        <div v-if="showTimeline" class="mt-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs">
                            <!-- Stepper Timeline -->
                            <div class="mb-4">
                                <ul v-if="props.order.status === 'cancelled'" class="steps steps-vertical w-full text-xs">
                                    <li class="step step-primary step-error font-bold text-left">Đặt hàng thành công</li>
                                    <li class="step step-primary step-error font-bold text-left">Đơn hàng đã hủy</li>
                                </ul>
                                <ul v-else class="steps steps-vertical w-full text-xs">
                                    <li class="step text-left" :class="getStepClass('pending')">Đặt hàng thành công</li>
                                    <li class="step text-left" :class="getStepClass('confirmed')">Đã xác nhận & Chuẩn bị</li>
                                    <li class="step text-left" :class="getStepClass('shipping')">Đang giao hàng</li>
                                    <li class="step text-left" :class="getStepClass('delivered')">Đã giao hàng</li>
                                    <li class="step text-left" :class="getStepClass('completed')">Đơn hàng hoàn tất</li>
                                </ul>
                            </div>

                            <!-- History Entries -->
                            <div v-if="sortedHistory.length > 0" class="space-y-3 pt-2 border-t border-slate-200/60">
                                <div v-for="(entry, index) in sortedHistory" :key="index" class="flex gap-2.5 items-start">
                                    <div class="w-2 h-2 rounded-full mt-1 shrink-0" :class="index === 0 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'"></div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-bold" :class="index === 0 ? 'text-emerald-700' : 'text-slate-700'">{{ statusText(entry.status) }}</p>
                                        <p class="text-slate-500 mt-0.5">{{ entry.description }}</p>
                                        <p class="text-[10px] text-slate-400 mt-0.5">{{ formatDate(entry.timestamp) }}</p>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center py-2 text-slate-400 text-xs">
                                Chưa có thông tin vận chuyển chi tiết
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Staff Info -->
                <div v-if="props.order.staff_id" class="border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                    NV xử lý: <span class="font-bold text-slate-600">{{ props.order.staff_id?.first_name }} {{ props.order.staff_id?.last_name }}</span>
                </div>
            </div>
        </div>

        <!-- ACTION BUTTONS SECTION -->
        <div class="p-4 pt-0">
            <!-- Staff & Admin Controls -->
            <div v-if="role === 'STAFF' || role === 'ADMIN'" class="space-y-2 border-t border-slate-100 pt-3">
                <div v-if="canTransitionTo('shipping') || props.order.status === 'shipping'" class="flex flex-col gap-1">
                    <label class="text-[10px] uppercase font-bold text-slate-400">Cập nhật Mã vận chuyển</label>
                    <div class="join w-full">
                        <input v-model="trackingInput" type="text" placeholder="Nhập mã vận đơn..." class="input input-bordered input-xs join-item w-full" />
                        <button @click="updateStatus('shipping')" class="btn btn-xs btn-primary join-item">Lưu</button>
                    </div>
                </div>

                <!-- Payment confirmation for non-COD -->
                <div v-if="(props.order.payment_status === 'unpaid' || props.order.payment_status === 'verifying') && props.order.payment_method !== 'COD'" class="mt-2">
                    <div v-if="props.order.payment_status === 'verifying'" class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1.5">
                        🔍 Khách đã xác nhận chuyển khoản. Vui lòng kiểm tra và xác nhận.
                    </div>
                    <button @click="updatePaymentStatus" class="btn btn-xs btn-success w-full text-white gap-1 font-bold">
                        ✅ Xác nhận đã nhận tiền
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-2">
                    <button v-if="canTransitionTo('confirmed')" @click="updateStatus('confirmed')" class="btn btn-success btn-sm text-white font-bold">✅ Xác nhận</button>
                    <button v-if="canTransitionTo('cancelled')" @click="updateStatus('cancelled')" class="btn btn-outline btn-error btn-sm font-bold">❌ Hủy</button>
                    <button v-if="canTransitionTo('shipping')" @click="updateStatus('shipping')" class="btn btn-info btn-sm text-white font-bold">🚚 Giao hàng</button>
                    <button v-if="canTransitionTo('delivered')" @click="updateStatus('delivered')" class="btn btn-primary btn-sm text-white font-bold">📦 Đã giao</button>
                </div>
                
                <button v-if="['delivered', 'completed', 'cancelled'].includes(props.order.status)" @click="deleteOrder" class="btn btn-ghost btn-xs w-full text-red-400 hover:text-red-600">Xóa đơn hàng</button>
            </div>

            <!-- Customer Controls -->
            <div v-if="role === 'CUSTOMER'" class="border-t border-slate-100 pt-3 space-y-2">
                <!-- Pay Now - VNPAY unpaid pending -->
                <button v-if="props.order.status === 'pending' && props.order.payment_method === 'VNPAY' && props.order.payment_status === 'unpaid'"
                        @click="payNow"
                        :disabled="isPaying"
                        class="btn btn-primary btn-sm w-full text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 border-none shadow-md font-bold">
                    <span v-if="isPaying" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 inline-block"></span>
                    💳 Thanh toán ngay (VNPAY)
                </button>

                <!-- Pay Now - VietQR/BANK_TRANSFER unpaid -->
                <button v-if="props.order.status === 'pending' && (props.order.payment_method === 'VIETQR' || props.order.payment_method === 'BANK_TRANSFER') && props.order.payment_status === 'unpaid'"
                        @click="router.push({ name: 'payment.qr', query: { order_id: props.order._id, order_code: props.order.order_code, amount: String(props.order.total_amount) } })"
                        class="btn btn-sm w-full text-white bg-emerald-700 hover:bg-emerald-800 border-none shadow-md font-bold">
                    📲 Thanh toán QR ngay
                </button>

                <!-- Verifying state -->   
                <div v-if="(props.order.payment_method === 'VIETQR' || props.order.payment_method === 'BANK_TRANSFER') && props.order.payment_status === 'verifying'"
                     class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center font-semibold">
                    🔍 Đang kiểm tra giao dịch chuyển khoản...
                </div>

                <!-- Paid badge -->
                <div v-if="props.order.payment_status === 'paid'"
                     class="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-center font-semibold">
                    ✅ Đã thanh toán thành công
                </div>

                <button v-if="props.order.status === 'pending'"
                        @click="updateStatus('cancelled')"
                        class="btn btn-outline btn-error btn-sm w-full font-bold">
                    Hủy đơn hàng
                </button>

                <!-- Actions for delivered/completed orders -->
                <div v-if="['delivered', 'completed'].includes(props.order.status)" class="grid grid-cols-3 gap-2">
                    <button @click="reviewProduct" class="btn btn-outline btn-primary btn-sm text-xs font-semibold">
                        ⭐ Đánh giá
                    </button>
                    <button @click="buyAgain" class="btn btn-outline btn-success btn-sm text-xs font-semibold">
                        🔁 Mua lại
                    </button>
                    <button @click="printInvoice" class="btn btn-outline btn-sm text-xs font-semibold">
                        🖨️ In HĐ
                    </button>
                </div>

                <!-- Print for all non-pending orders -->
                <button v-if="!['pending', 'delivered', 'completed'].includes(props.order.status)"
                        @click="printInvoice"
                        class="btn btn-ghost btn-xs w-full text-slate-500 hover:text-slate-800">
                    🖨️ In hóa đơn
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
    transition: all 0.25s ease-in-out;
    overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>