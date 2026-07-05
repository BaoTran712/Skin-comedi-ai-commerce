<script setup>
import { useRouter } from "vue-router";
import { ref, computed } from 'vue';
import OrderService from "../services/order.service";
import ProductService from "../services/product.service";
import { push } from "notivue";

const role = computed(() => localStorage.getItem("role"));
const staff_id = computed(() => localStorage.getItem("id"));
const router = useRouter();
const orderService = new OrderService();
const productService = new ProductService();
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

const paymentMethodText = (method) => {
    switch (method) {
        case 'COD': return 'Thanh toán khi nhận hàng';
        case 'BANK_TRANSFER': return 'Chuyển khoản ngân hàng';
        case 'VNPAY': return 'Ví điện tử VNPAY';
        default: return 'Không xác định';
    }
};

const paymentMethodIcon = (method) => {
    switch (method) {
        case 'COD': return '💵';
        case 'BANK_TRANSFER': return '🏦';
        case 'VNPAY': return '📱';
        default: return '💳';
    }
};

const paymentStatusText = (status) => {
    switch (status) {
        case 'paid': return 'Đã thanh toán';
        case 'unpaid': return 'Chưa thanh toán';
        default: return 'Không xác định';
    }
};

const paymentStatusClass = (status) => {
    return status === 'paid' ? 'badge-success text-white' : 'badge-warning text-white';
};

const updateStatus = async (status) => {
    try {
        const payload = { status, staff_id: staff_id.value };
        if (status === 'shipping' && trackingInput.value) {
            payload.tracking_number = trackingInput.value;
        }
        await orderService.updateOrder(props.order._id, payload);
        
        // Update product quantity if confirmed
        if (status === 'confirmed' && props.order.product_id?.quantity > 0) {
            await productService.updateProduct(props.order.product_id?._id, { 
                quantity: props.order.product_id.quantity - 1 
            });
        }
        
        push.success(`Cập nhật trạng thái: ${statusText(status)} thành công`);
        emit("fetchOrders");
    } catch (error) {
        console.error(error);
        push.error("Lỗi khi cập nhật trạng thái");
    }
};

const updatePaymentStatus = async () => {
    try {
        await orderService.updateOrder(props.order._id, { payment_status: "paid" });
        push.success("Đã xác nhận thanh toán");
        emit("fetchOrders");
    } catch (error) {
        push.error("Lỗi khi cập nhật thanh toán");
    }
};

const statusText = (status) => {
    switch (status) {
        case 'pending': return 'Chờ xác nhận';
        case 'confirmed': return 'Đã xác nhận';
        case 'shipping': return 'Đang giao hàng';
        case 'delivered': return 'Đã giao hàng';
        case 'cancelled': return 'Đã hủy';
        default: return 'Không xác định';
    }
};

const statusClass = (status) => {
    switch (status) {
        case 'pending': return 'text-amber-500';
        case 'confirmed': return 'text-blue-500';
        case 'shipping': return 'text-sky-500';
        case 'delivered': return 'text-emerald-500';
        case 'cancelled': return 'text-red-500';
        default: return 'text-gray-500';
    }
};

const statusBgClass = (status) => {
    switch (status) {
        case 'pending': return 'bg-amber-500';
        case 'confirmed': return 'bg-blue-500';
        case 'shipping': return 'bg-sky-500';
        case 'delivered': return 'bg-emerald-500';
        case 'cancelled': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
};

const statusRingClass = (status) => {
    switch (status) {
        case 'pending': return 'ring-amber-200';
        case 'confirmed': return 'ring-blue-200';
        case 'shipping': return 'ring-sky-200';
        case 'delivered': return 'ring-emerald-200';
        case 'cancelled': return 'ring-red-200';
        default: return 'ring-gray-200';
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

const sortedHistory = computed(() => {
    if (!props.order.tracking_history) return [];
    return [...props.order.tracking_history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});
</script>

<template>
    <div class="flex flex-col shadow-lg rounded-xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div class="relative h-48 w-full group">
            <div v-if="loading" class="skeleton absolute inset-0 w-full h-full"></div>
            <img :src="`https://picsum.photos/seed/${props.order.product_id?.title}/800`" 
                 @load="loading = false"
                 class="w-full h-full object-cover"
                 :class="{'opacity-0': loading}" />
            <div class="absolute top-2 right-2">
                <span :class="['badge badge-sm font-bold p-3 shadow-sm', statusClass(props.order.status)]">
                    {{ statusText(props.order.status) }}
                </span>
            </div>
        </div>

        <div class="p-4 space-y-3">
            <h3 class="font-bold text-lg text-gray-800 truncate">{{ props.order.product_id?.title || 'Sản phẩm' }}</h3>
            
            <div class="space-y-2 text-sm border-t pt-3">
                <div class="flex justify-between">
                    <span class="text-gray-500">Mã đơn:</span>
                    <span class="font-mono text-xs">{{ props.order._id.slice(-8).toUpperCase() }}</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-gray-500">Địa chỉ:</span>
                    <span class="font-medium text-gray-700">{{ props.order.shipping_address }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">SĐT:</span>
                    <span class="font-medium text-gray-700">{{ props.order.phone_number }}</span>
                </div>
                <div v-if="props.order.tracking_number" class="flex justify-between items-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <span class="text-blue-700 font-bold text-xs">Mã vận chuyển:</span>
                    <span class="font-mono text-blue-800 font-bold">{{ props.order.tracking_number }}</span>
                </div>
            </div>

            <!-- Payment Info -->
            <div class="border-t pt-3 space-y-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">{{ paymentMethodIcon(props.order.payment_method) }}</span>
                        <span class="text-xs font-semibold text-gray-600">{{ paymentMethodText(props.order.payment_method) }}</span>
                    </div>
                    <span :class="['badge badge-xs font-bold', paymentStatusClass(props.order.payment_status)]">
                        {{ paymentStatusText(props.order.payment_status) }}
                    </span>
                </div>
            </div>

            <!-- Tracking Timeline Toggle -->
            <div class="border-t pt-3">
                <button @click="showTimeline = !showTimeline" 
                        class="btn btn-ghost btn-xs w-full gap-2 text-primary hover:bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    {{ showTimeline ? 'Ẩn hành trình' : 'Chi tiết vận chuyển' }}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 transition-transform duration-300" 
                         :class="{ 'rotate-180': showTimeline }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                <!-- Timeline Content -->
                <transition name="slide">
                    <div v-if="showTimeline" class="mt-3 pl-2">
                        <div v-if="sortedHistory.length > 0" class="relative">
                            <div v-for="(entry, index) in sortedHistory" :key="index"
                                 class="flex gap-3 pb-4 last:pb-0">
                                <!-- Timeline dot & line -->
                                <div class="flex flex-col items-center">
                                    <div :class="['w-3 h-3 rounded-full ring-4 shrink-0', 
                                                   statusBgClass(entry.status), 
                                                   statusRingClass(entry.status),
                                                   index === 0 ? 'scale-125' : 'opacity-60']">
                                    </div>
                                    <div v-if="index < sortedHistory.length - 1" 
                                         class="w-0.5 flex-1 bg-gray-200 mt-1"></div>
                                </div>
                                <!-- Content -->
                                <div class="flex-1 min-w-0 -mt-0.5">
                                    <p :class="['text-xs font-bold', index === 0 ? statusClass(entry.status) : 'text-gray-500']">
                                        {{ statusText(entry.status) }}
                                    </p>
                                    <p class="text-xs text-gray-500 mt-0.5">{{ entry.description }}</p>
                                    <p class="text-[10px] text-gray-400 mt-0.5">{{ formatDate(entry.timestamp) }}</p>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-4">
                            <p class="text-xs text-gray-400">Chưa có thông tin vận chuyển</p>
                        </div>
                    </div>
                </transition>
            </div>

            <!-- Staff Controls -->
            <div v-if="role === 'staff'" class="space-y-2 border-t pt-3">
                <div v-if="props.order.status === 'confirmed' || props.order.status === 'shipping'" class="flex flex-col gap-1">
                    <label class="text-[10px] uppercase font-bold text-gray-400">Cập nhật Mã vận chuyển</label>
                    <div class="join w-full">
                        <input v-model="trackingInput" type="text" placeholder="Nhập mã..." class="input input-bordered input-xs join-item w-full" />
                        <button @click="updateStatus('shipping')" class="btn btn-xs btn-primary join-item">Lưu</button>
                    </div>
                </div>

                <!-- Payment confirmation for non-COD -->
                <div v-if="props.order.payment_status === 'unpaid' && props.order.payment_method !== 'COD'" class="mt-2">
                    <button @click="updatePaymentStatus" class="btn btn-xs btn-success w-full text-white gap-1">
                        ✅ Xác nhận đã thanh toán
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-4">
                    <button v-if="props.order.status === 'pending'" @click="updateStatus('confirmed')" class="btn btn-success btn-sm text-white">Xác nhận</button>
                    <button v-if="props.order.status === 'pending'" @click="updateStatus('cancelled')" class="btn btn-outline btn-error btn-sm">Hủy</button>
                    
                    <button v-if="props.order.status === 'confirmed'" @click="updateStatus('shipping')" class="btn btn-info btn-sm text-white">Giao hàng</button>
                    <button v-if="props.order.status === 'shipping'" @click="updateStatus('delivered')" class="btn btn-primary btn-sm text-white">Đã giao</button>
                </div>
                
                <button v-if="['delivered', 'cancelled'].includes(props.order.status)" @click="deleteOrder" class="btn btn-ghost btn-xs w-full text-red-400">Xóa đơn hàng</button>
            </div>

            <div v-if="role === 'user' && props.order.status === 'pending'" class="pt-2">
                <button @click="updateStatus('cancelled')" class="btn btn-outline btn-error btn-sm w-full">Hủy đơn hàng</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
    max-height: 500px;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
    transform: translateY(-8px);
}
</style>