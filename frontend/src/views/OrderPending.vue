<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import InputSearch from "../components/InputSearch.vue";

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
                order._id,
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

const delayedOrders = computed(() => {
    const now = new Date();
    return orders.value.filter(order => {
        if (order.status === 'pending') {
            const orderDate = new Date(order.order_date || order.createdAt);
            const diffTime = Math.abs(now - orderDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 1;
        }
        if (order.status === 'shipping') {
            const updatedDate = new Date(order.updatedAt);
            const diffTime = Math.abs(now - updatedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 3;
        }
        return false;
    });
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

const statusText = (status) => {
    const map = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy' };
    return map[status] || 'Không xác định';
};

const statusClass = (status) => {
    const map = { pending: 'badge-warning text-white', confirmed: 'badge-info text-white', shipping: 'badge-primary text-white', delivered: 'badge-success text-white', cancelled: 'badge-error text-white' };
    return map[status] || 'badge-ghost';
};

const paymentStatusText = (status) => status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
const paymentStatusClass = (status) => status === 'paid' ? 'badge-success text-white' : 'badge-warning text-white';

const formatPrice = (price) => {
    if (!price) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const updateOrderStatus = async (order, event) => {
    const newStatus = event.target.value;
    try {
        let payload = { status: newStatus, staff_id: staff_id.value };
        if (newStatus === 'shipping') {
            const tracking = prompt("Nhập mã vận chuyển (nếu có):", order.tracking_number || "");
            if (tracking !== null) {
                payload.tracking_number = tracking;
            } else {
                event.target.value = order.status;
                return;
            }
        }
        await orderService.updateOrder(order._id, payload);
        
        if (newStatus === 'confirmed' && order.product_id?.quantity > 0) {
            await productService.updateProduct(order.product_id?._id, { quantity: order.product_id.quantity - 1 });
        }
        push.success("Cập nhật trạng thái thành công");
        fetchOrders();
    } catch (error) {
        console.error(error);
        push.error("Lỗi khi cập nhật trạng thái");
        fetchOrders();
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
    <AdminLayout>
        <div class="flex flex-col gap-6">
                <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h1 class="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
                    
                    <div class="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
                        <div class="tooltip" data-tip="Tìm mã đơn hàng, sản phẩm, khách, SĐT...">
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

                <div v-if="delayedOrders.length > 0" class="alert alert-error shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h3 class="font-bold">Cảnh báo: Có {{ delayedOrders.length }} đơn hàng chậm trễ!</h3>
                        <div class="text-xs">Vui lòng kiểm tra và xử lý gấp các đơn hàng đang chờ quá 1 ngày hoặc đang giao quá 3 ngày.</div>
                    </div>
                    <button class="btn btn-sm" @click="handleFilterStatus('pending')">Xem đơn chờ</button>
                    <button class="btn btn-sm" @click="handleFilterStatus('shipping')">Xem đơn đang giao</button>
                </div>

                <template v-if=" filteredOrders.length > 0 ">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                        <table class="table table-sm table-zebra w-full text-xs">
                            <thead class="bg-gray-50 text-gray-600 text-xs">
                                <tr>
                                    <th>Mã Đơn</th>
                                    <th>Khách Hàng</th>
                                    <th>Sản Phẩm</th>
                                    <th>Tổng Tiền</th>
                                    <th>Thanh Toán</th>
                                    <th>Trạng Thái</th>
                                    <th class="w-32">Cập Nhật</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="order in filteredOrders" :key="order._id" class="hover:bg-gray-50">
                                    <td class="font-mono text-[11px] font-bold text-gray-500">{{ order._id.slice(-8).toUpperCase() }}</td>
                                    <td>
                                        <div class="font-bold">{{ order.user_id?.first_name }} {{ order.user_id?.last_name }}</div>
                                        <div class="text-[10px] text-gray-500">{{ order.phone_number }}</div>
                                    </td>
                                    <td>
                                        <div class="font-medium truncate max-w-[200px]" :title="order.product_id?.title">{{ order.product_id?.title }}</div>
                                    </td>
                                    <td class="font-bold text-emerald-600">{{ formatPrice(order.total_amount) }}</td>
                                    <td>
                                        <div class="badge badge-sm text-xs font-bold" :class="paymentStatusClass(order.payment_status)">{{ paymentStatusText(order.payment_status) }}</div>
                                    </td>
                                    <td>
                                        <div class="badge badge-sm font-bold text-xs" :class="statusClass(order.status)">{{ statusText(order.status) }}</div>
                                    </td>
                                    <td>
                                        <select :value="order.status" @change="updateOrderStatus(order, $event)" class="select select-bordered select-sm w-full max-w-xs text-xs font-bold bg-white">
                                            <option value="pending">Chờ xác nhận</option>
                                            <option value="confirmed">Đã xác nhận</option>
                                            <option value="shipping">Đang giao</option>
                                            <option value="delivered">Đã giao</option>
                                            <option value="cancelled">Đã hủy</option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>

                <template v-else>
                    <div class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p class="text-xl font-medium text-gray-400">Không tìm thấy đơn hàng nào phù hợp</p>
                    </div>
                </template>
        </div>
    </AdminLayout>
</template>