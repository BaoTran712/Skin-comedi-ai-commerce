<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import SupplierService from "../services/supplier.service";
import ProductService from "../services/product.service";
import ImportReceiptService from "../services/importReceipt.service";
import { push } from "notivue";

const router = useRouter();
const supplierService = new SupplierService();
const productService = new ProductService();
const receiptService = new ImportReceiptService();

const suppliers = ref([]);
const products = ref([]);
const staff_id = computed(() => localStorage.getItem("id"));

const selectedSupplier = ref("");
const note = ref("");
const items = ref([]); // array of { product_id, title, quantity, import_price }

// Form helper for adding a product to the receipt list
const currentProduct = ref("");
const currentQuantity = ref(1);
const currentImportPrice = ref(0);

onMounted(async () => {
    try {
        const [sups, prods] = await Promise.all([
            supplierService.getAllSuppliers(),
            productService.getAllProducts()
        ]);
        suppliers.value = sups.filter(s => s.status === 'active');
        products.value = prods;
    } catch (error) {
        push.error("Lỗi khi tải dữ liệu ban đầu");
    }
});

const addProductToItems = () => {
    if (!currentProduct.value) {
        push.error("Vui lòng chọn sản phẩm!");
        return;
    }
    if (currentQuantity.value <= 0) {
        push.error("Số lượng phải lớn hơn 0!");
        return;
    }
    if (currentImportPrice.value < 0) {
        push.error("Đơn giá nhập không được âm!");
        return;
    }

    const prod = products.value.find(p => p._id === currentProduct.value);
    
    // Check if product already added
    const existing = items.value.find(item => item.product_id === currentProduct.value);
    if (existing) {
        existing.quantity += currentQuantity.value;
    } else {
        items.value.push({
            product_id: prod._id,
            title: prod.title,
            quantity: currentQuantity.value,
            import_price: currentImportPrice.value
        });
    }

    // Reset inputs
    currentProduct.value = "";
    currentQuantity.value = 1;
    currentImportPrice.value = 0;
};

const removeItem = (index) => {
    items.value.splice(index, 1);
};

const totalAmount = computed(() => {
    return items.value.reduce((acc, item) => acc + (item.quantity * item.import_price), 0);
});

const submitReceipt = async () => {
    if (!selectedSupplier.value) {
        push.error("Vui lòng chọn nhà cung cấp!");
        return;
    }
    if (items.value.length === 0) {
        push.error("Vui lòng thêm ít nhất một sản phẩm!");
        return;
    }

    try {
        const payload = {
            staff_id: staff_id.value,
            supplier_id: selectedSupplier.value,
            note: note.value,
            items: items.value.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                import_price: item.import_price
            }))
        };

        await receiptService.createReceipt(payload);
        push.success("Tạo đơn nhập hàng thành công!");
        router.push("/imports");
    } catch (error) {
        push.error("Có lỗi xảy ra khi tạo đơn nhập");
    }
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
</script>

<template>
    <AdminLayout>
        <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div>
                <h1 class="text-xl font-bold text-gray-800">Nhập hàng mới</h1>
                <p class="text-xs text-gray-500">Tạo phiếu ghi nhận lô hàng mới nhập kho</p>
            </div>
            <button class="btn btn-ghost btn-sm h-8 min-h-0 text-xs font-bold" @click="router.push('/imports')">
                Quay lại
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Form thông tin chung & Chọn sản phẩm -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Chọn sản phẩm -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 class="text-sm font-bold text-gray-800 mb-4">Thêm sản phẩm vào phiếu</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div class="md:col-span-3">
                            <label class="label p-1"><span class="label-text text-xs font-bold">Sản phẩm *</span></label>
                            <select v-model="currentProduct" class="select select-bordered select-sm w-full text-xs bg-white">
                                <option value="">--- Chọn sản phẩm ---</option>
                                <option v-for="prod in products" :key="prod._id" :value="prod._id">
                                    {{ prod.title }} (Hiện tại: {{ prod.quantity }})
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="label p-1"><span class="label-text text-xs font-bold">Số lượng *</span></label>
                            <input type="number" v-model="currentQuantity" min="1" class="input input-bordered input-sm w-full text-xs bg-white" />
                        </div>
                        <div>
                            <label class="label p-1"><span class="label-text text-xs font-bold">Đơn giá nhập (đ) *</span></label>
                            <input type="number" v-model="currentImportPrice" min="0" class="input input-bordered input-sm w-full text-xs bg-white" />
                        </div>
                        <div class="flex items-end">
                            <button type="button" @click="addProductToItems" class="btn btn-primary btn-sm w-full text-xs font-bold h-8 min-h-0">
                                Thêm vào bảng
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Danh sách sản phẩm đã thêm -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 class="text-sm font-bold text-gray-800 mb-4">Danh sách sản phẩm nhập</h2>
                    <div class="overflow-x-auto">
                        <table class="table table-sm w-full text-xs">
                            <thead class="bg-gray-50 text-gray-600">
                                <tr>
                                    <th>Tên sản phẩm</th>
                                    <th class="text-right">Đơn giá nhập</th>
                                    <th class="text-center">Số lượng</th>
                                    <th class="text-right">Thành tiền</th>
                                    <th class="text-center">Xóa</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in items" :key="item.product_id" class="hover:bg-gray-50">
                                    <td class="font-medium text-gray-800">{{ item.title }}</td>
                                    <td class="text-right">{{ formatPrice(item.import_price) }}</td>
                                    <td class="text-center">{{ item.quantity }}</td>
                                    <td class="text-right font-bold text-emerald-600">{{ formatPrice(item.import_price * item.quantity) }}</td>
                                    <td class="text-center">
                                        <button @click="removeItem(index)" class="btn btn-ghost btn-xs text-red-500">Xóa</button>
                                    </td>
                                </tr>
                                <tr v-if="items.length === 0">
                                    <td colspan="5" class="text-center py-8 text-gray-400">Chưa có sản phẩm nào được chọn</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tổng đơn hàng & Xác nhận -->
            <div class="space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 class="text-sm font-bold text-gray-800 mb-4">Thông tin nhập hàng</h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="label p-1"><span class="label-text text-xs font-bold">Nhà cung cấp *</span></label>
                            <select v-model="selectedSupplier" class="select select-bordered select-sm w-full text-xs bg-white">
                                <option value="">--- Chọn nhà cung cấp ---</option>
                                <option v-for="sup in suppliers" :key="sup._id" :value="sup._id">{{ sup.name }}</option>
                            </select>
                        </div>

                        <div>
                            <label class="label p-1"><span class="label-text text-xs font-bold">Ghi chú phiếu nhập</span></label>
                            <textarea v-model="note" rows="3" class="textarea textarea-bordered textarea-sm w-full text-xs bg-white" placeholder="Thông tin lô hàng, thời gian giao..."></textarea>
                        </div>

                        <div class="divider my-2"></div>

                        <div class="flex justify-between items-center text-xs font-medium">
                            <span class="text-gray-500">Tổng cộng:</span>
                            <span class="text-lg font-black text-emerald-600">{{ formatPrice(totalAmount) }}</span>
                        </div>

                        <button @click="submitReceipt" class="btn btn-primary btn-sm w-full text-xs font-bold mt-4 h-9">
                            Xác nhận nhập kho
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </AdminLayout>
</template>
