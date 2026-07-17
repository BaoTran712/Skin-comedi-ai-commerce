<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import { ref, onMounted, computed } from "vue";
import ImportReceiptService from "../services/importReceipt.service";
import { useRouter } from "vue-router";
import { push } from "notivue";

const router = useRouter();
const receiptService = new ImportReceiptService();
const receipts = ref([]);
const selectedReceipt = ref(null);
const selectedDetails = ref([]);
const showDetailsModal = ref(false);
const isLoading = ref(true);

const fetchReceipts = async () => {
    try {
        isLoading.value = true;
        receipts.value = await receiptService.getAllReceipts();
    } catch (error) {
        console.error(error);
        push.error("Lỗi khi tải lịch sử nhập kho");
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchReceipts();
});

const formatPrice = (price) => {
    if (!price) return "0 đ";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN") + " " + new Date(dateString).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'});
};

const viewDetails = async (id) => {
    try {
        const response = await receiptService.getReceiptById(id);
        selectedReceipt.value = response.receipt;
        selectedDetails.value = response.details;
        showDetailsModal.value = true;
    } catch (error) {
        push.error("Lỗi khi tải chi tiết đơn nhập");
    }
};
</script>

<template>
    <AdminLayout>
        <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div>
                <h1 class="text-xl font-bold text-gray-800">Lịch sử Nhập hàng</h1>
                <p class="text-xs text-gray-500">Danh sách các đợt nhập hàng hóa vào kho</p>
            </div>
            <button class="btn btn-primary btn-sm h-8 min-h-0 text-xs font-bold" @click="router.push('/imports/add')">
                + Nhập hàng mới
            </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table class="table table-sm table-zebra w-full text-xs">
                <thead class="bg-gray-50 text-gray-600 text-xs">
                    <tr>
                        <th>Mã Phiếu</th>
                        <th>Nhà cung cấp</th>
                        <th>Thời gian</th>
                        <th>Người nhập</th>
                        <th>Tổng tiền</th>
                        <th>Ghi chú</th>
                        <th class="text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="receipt in receipts" :key="receipt._id" class="hover:bg-gray-50">
                        <td class="font-mono text-[11px] font-bold text-gray-500">{{ receipt._id.slice(-8).toUpperCase() }}</td>
                        <td class="font-bold text-gray-800">{{ receipt.supplier_id?.name || '---' }}</td>
                        <td>{{ formatDate(receipt.createdAt) }}</td>
                        <td>{{ receipt.staff_id?.name || '---' }}</td>
                        <td class="font-bold text-emerald-600">{{ formatPrice(receipt.total_amount) }}</td>
                        <td class="max-w-[150px] truncate" :title="receipt.note">{{ receipt.note || '---' }}</td>
                        <td class="text-right">
                            <button @click="viewDetails(receipt._id)" class="btn btn-ghost btn-xs text-blue-500 font-bold">Xem chi tiết</button>
                        </td>
                    </tr>
                    <tr v-if="receipts.length === 0 && !isLoading">
                        <td colspan="7" class="text-center py-8 text-gray-400">Chưa có phiếu nhập kho nào</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Chi tiết Modal -->
        <dialog class="modal" :class="{'modal-open': showDetailsModal}">
            <div class="modal-box max-w-2xl bg-white">
                <h3 class="font-bold text-lg mb-4 text-gray-800">Chi tiết Phiếu Nhập Kho</h3>
                
                <div v-if="selectedReceipt" class="grid grid-cols-2 gap-4 mb-6 text-xs text-gray-600">
                    <div><strong>Mã phiếu:</strong> <span class="font-mono font-bold">{{ selectedReceipt._id.toUpperCase() }}</span></div>
                    <div><strong>Nhà cung cấp:</strong> {{ selectedReceipt.supplier_id?.name }}</div>
                    <div><strong>Ngày nhập:</strong> {{ formatDate(selectedReceipt.createdAt) }}</div>
                    <div><strong>Người thực hiện:</strong> {{ selectedReceipt.staff_id?.name }}</div>
                    <div class="col-span-2"><strong>Ghi chú:</strong> {{ selectedReceipt.note || 'Không có' }}</div>
                </div>

                <div class="border rounded-lg overflow-hidden">
                    <table class="table table-sm w-full text-xs">
                        <thead class="bg-gray-50 text-gray-600">
                            <tr>
                                <th>Sản phẩm</th>
                                <th class="text-right">Đơn giá nhập</th>
                                <th class="text-center">Số lượng</th>
                                <th class="text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="detail in selectedDetails" :key="detail._id">
                                <td>
                                    <div class="font-bold text-gray-800">{{ detail.product_id?.title || 'Sản phẩm đã xóa' }}</div>
                                </td>
                                <td class="text-right">{{ formatPrice(detail.import_price) }}</td>
                                <td class="text-center">{{ detail.quantity }}</td>
                                <td class="text-right font-bold text-emerald-600">{{ formatPrice(detail.import_price * detail.quantity) }}</td>
                            </tr>
                            <tr class="bg-gray-50 font-bold border-t">
                                <td colspan="3" class="text-right">Tổng cộng:</td>
                                <td class="text-right text-emerald-600">{{ formatPrice(selectedReceipt?.total_amount) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="modal-action">
                    <button class="btn btn-ghost btn-sm" @click="showDetailsModal = false">Đóng</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop" @click="showDetailsModal = false">
                <button>close</button>
            </form>
        </dialog>
    </AdminLayout>
</template>
