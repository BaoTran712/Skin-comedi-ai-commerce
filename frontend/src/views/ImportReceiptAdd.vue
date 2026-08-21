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
const brands = ref([]);
const staff_id = computed(() => localStorage.getItem("id"));

const selectedSupplier = ref("");
const note = ref("");
const items = ref([]); // array of { product_id, title, quantity, import_price }

// Form helper for adding a product to the receipt list
const currentProduct = ref("");
const currentQuantity = ref(1);
const currentImportPrice = ref(0);

// Modal states
const showNewSupplierModal = ref(false);
const showNewProductModal = ref(false);
const showNewBrandModal = ref(false);

// New Supplier Form Fields
const newSupName = ref("");
const newSupPhone = ref("");
const newSupEmail = ref("");
const newSupAddress = ref("");
const isSavingSupplier = ref(false);

// New Product Form Fields
const newProdTitle = ref("");
const newProdBrand = ref("");
const newProdPrice = ref(0);
const newProdQuantity = ref(0);
const newProdExpiry = ref("12/2027");
const newProdImage = ref("");
const newProdUsage = ref("");
const isSavingProduct = ref(false);

// New Brand Form Fields
const newBrandName = ref("");
const newBrandDescription = ref("");
const isSavingBrand = ref(false);

import BrandService from "../services/brand.service";
const brandService = new BrandService();

const refreshDropdownData = async () => {
    try {
        const [sups, prods, bnds] = await Promise.all([
            supplierService.getAllSuppliers(),
            productService.getAllProducts(),
            brandService.getAllBrands()
        ]);
        suppliers.value = sups.filter(s => s.status === 'active');
        products.value = prods;
        brands.value = bnds;
    } catch (error) {
        push.error("Lỗi khi cập nhật dữ liệu");
    }
};

onMounted(refreshDropdownData);

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

const saveSupplier = async () => {
    if (!newSupName.value.trim()) {
        push.error("Tên nhà cung cấp bắt buộc!");
        return;
    }
    try {
        isSavingSupplier.value = true;
        const newSup = await supplierService.createSupplier({
            name: newSupName.value.trim(),
            phone: newSupPhone.value.trim(),
            email: newSupEmail.value.trim(),
            address: newSupAddress.value.trim()
        });
        
        push.success("Tạo nhà cung cấp mới thành công!");
        showNewSupplierModal.value = false;
        
        // Reload list and set newly created supplier
        await refreshDropdownData();
        selectedSupplier.value = newSup._id || newSup.id;
        
        // Reset form
        newSupName.value = "";
        newSupPhone.value = "";
        newSupEmail.value = "";
        newSupAddress.value = "";
    } catch (e) {
        push.error("Lỗi khi lưu nhà cung cấp mới");
    } finally {
        isSavingSupplier.value = false;
    }
};

const saveProduct = async () => {
    if (!newProdTitle.value.trim()) {
        push.error("Tên sản phẩm bắt buộc!");
        return;
    }
    if (newProdPrice.value < 0 || newProdQuantity.value < 0) {
        push.error("Số lượng/giá bán không hợp lệ!");
        return;
    }

    // Check duplicate products
    const duplicate = products.value.find(p => p.title.toLowerCase() === newProdTitle.value.trim().toLowerCase());
    if (duplicate) {
        if (confirm(`Sản phẩm "${duplicate.title}" đã tồn tại. Bạn có muốn sử dụng sản phẩm hiện có không?`)) {
            currentProduct.value = duplicate._id;
            showNewProductModal.value = false;
            return;
        }
    }

    try {
        isSavingProduct.value = true;
        const newProd = await productService.createProduct({
            title: newProdTitle.value.trim(),
            name: newProdTitle.value.trim(),
            price: Number(newProdPrice.value),
            quantity: Number(newProdQuantity.value),
            expiry_date: newProdExpiry.value,
            image: newProdImage.value.trim() || undefined,
            usage: newProdUsage.value.trim(),
            brand_id: newProdBrand.value || undefined
        });

        push.success("Tạo sản phẩm mới thành công!");
        showNewProductModal.value = false;

        // Reload lists and set newly created product details inside fields
        await refreshDropdownData();
        currentProduct.value = newProd.document?._id || newProd._id || newProd.id;
        currentQuantity.value = Number(newProdQuantity.value) || 1;
        
        // Reset form
        newProdTitle.value = "";
        newProdBrand.value = "";
        newProdPrice.value = 0;
        newProdQuantity.value = 0;
        newProdExpiry.value = "12/2027";
        newProdImage.value = "";
        newProdUsage.value = "";
    } catch (e) {
        push.error("Lỗi khi thêm sản phẩm mới");
    } finally {
        isSavingProduct.value = false;
    }
};

const saveBrand = async () => {
    if (!newBrandName.value.trim()) {
        push.error("Tên nhãn hàng bắt buộc!");
        return;
    }
    try {
        isSavingBrand.value = true;
        const brand = await brandService.createBrand({
            name: newBrandName.value.trim(),
            description: newBrandDescription.value.trim()
        });

        push.success("Thêm nhãn hàng mới thành công!");
        showNewBrandModal.value = false;

        // Reload brand lists
        await refreshDropdownData();
        newProdBrand.value = brand._id || brand.id;

        // Reset Form
        newBrandName.value = "";
        newBrandDescription.value = "";
    } catch (e) {
        push.error("Lỗi khi thêm nhãn hàng");
    } finally {
        isSavingBrand.value = false;
    }
};

const handleProductDropdownChange = (event) => {
    if (event.target.value === "ADD_NEW") {
        currentProduct.value = "";
        showNewProductModal.value = true;
    }
};

const handleSupplierDropdownChange = (event) => {
    if (event.target.value === "ADD_NEW") {
        selectedSupplier.value = "";
        showNewSupplierModal.value = true;
    }
};

const handleBrandDropdownChange = (event) => {
    if (event.target.value === "ADD_NEW") {
        newProdBrand.value = "";
        showNewBrandModal.value = true;
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
                            <label class="label p-1 flex justify-between items-center">
                                <span class="label-text text-xs font-bold">Sản phẩm *</span>
                                <button type="button" @click="showNewProductModal = true" class="text-[10px] text-primary font-bold hover:underline">+ Thêm sản phẩm mới</button>
                            </label>
                            <select v-model="currentProduct" @change="handleProductDropdownChange" class="select select-bordered select-sm w-full text-xs bg-white">
                                <option value="">--- Chọn sản phẩm ---</option>
                                <option v-for="prod in products" :key="prod._id" :value="prod._id">
                                    {{ prod.title }} (Hiện tại: {{ prod.quantity }})
                                </option>
                                <option value="ADD_NEW" class="text-primary font-bold">+ Thêm sản phẩm mới</option>
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
                            <label class="label p-1 flex justify-between items-center">
                                <span class="label-text text-xs font-bold">Nhà cung cấp *</span>
                                <button type="button" @click="showNewSupplierModal = true" class="text-[10px] text-primary font-bold hover:underline">+ Thêm nhà cung cấp mới</button>
                            </label>
                            <select v-model="selectedSupplier" @change="handleSupplierDropdownChange" class="select select-bordered select-sm w-full text-xs bg-white">
                                <option value="">--- Chọn nhà cung cấp ---</option>
                                <option v-for="sup in suppliers" :key="sup._id" :value="sup._id">{{ sup.name }}</option>
                                <option value="ADD_NEW" class="text-primary font-bold">+ Thêm nhà cung cấp mới</option>
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

        <!-- NEW SUPPLIER QUICK MODAL -->
        <div v-if="showNewSupplierModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-xs">
            <div class="bg-[#FAF8F5] border border-[#EBE7DF] rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-left">
                <button @click="showNewSupplierModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                <h3 class="font-serif text-lg text-[#064E3B] font-bold mb-4">➕ Thêm nhà cung cấp mới nhanh</h3>
                
                <form @submit.prevent="saveSupplier" class="space-y-3">
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Tên nhà cung cấp *</label>
                        <input v-model="newSupName" type="text" class="input input-bordered input-sm w-full bg-white text-xs" required />
                    </div>
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Số điện thoại</label>
                        <input v-model="newSupPhone" type="text" class="input input-bordered input-sm w-full bg-white text-xs" />
                    </div>
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Email</label>
                        <input v-model="newSupEmail" type="email" class="input input-bordered input-sm w-full bg-white text-xs" />
                    </div>
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Địa chỉ</label>
                        <input v-model="newSupAddress" type="text" class="input input-bordered input-sm w-full bg-white text-xs" />
                    </div>
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" @click="showNewSupplierModal = false" class="btn btn-ghost btn-sm">Hủy</button>
                        <button type="submit" :disabled="isSavingSupplier" class="btn btn-primary btn-sm px-6">
                            Lưu nhà cung cấp
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- NEW PRODUCT QUICK MODAL -->
        <div v-if="showNewProductModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-xs">
            <div class="bg-[#FAF8F5] border border-[#EBE7DF] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left">
                <button @click="showNewProductModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                <h3 class="font-serif text-lg text-[#064E3B] font-bold mb-4">➕ Thêm sản phẩm mới nhanh</h3>
                
                <form @submit.prevent="saveProduct" class="grid grid-cols-2 gap-4">
                    <div class="col-span-2">
                        <label class="block font-bold text-gray-600 mb-1">Tên sản phẩm *</label>
                        <input v-model="newProdTitle" type="text" class="input input-bordered input-sm w-full bg-white text-xs" required />
                    </div>
                    <div>
                        <label class="block font-bold text-gray-600 mb-1 flex justify-between items-center">
                            <span>Thương hiệu</span>
                            <button type="button" @click="showNewBrandModal = true" class="text-[10px] text-primary font-bold hover:underline">+ Mới</button>
                        </label>
                        <select v-model="newProdBrand" @change="handleBrandDropdownChange" class="select select-bordered select-sm w-full bg-white text-xs">
                            <option value="">Chọn thương hiệu</option>
                            <option v-for="b in brands" :key="b._id" :value="b._id">{{ b.name }}</option>
                            <option value="ADD_NEW" class="text-primary font-bold">+ Thêm nhãn hàng mới</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Hạn sử dụng</label>
                        <input v-model="newProdExpiry" type="text" class="input input-bordered input-sm w-full bg-white text-xs" />
                    </div>
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Giá bán dự kiến (đ) *</label>
                        <input v-model.number="newProdPrice" type="number" min="0" class="input input-bordered input-sm w-full bg-white text-xs" required />
                    </div>
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Số lượng nhập đầu kì *</label>
                        <input v-model.number="newProdQuantity" type="number" min="0" class="input input-bordered input-sm w-full bg-white text-xs" required />
                    </div>
                    <div class="col-span-2">
                        <label class="block font-bold text-gray-600 mb-1">Link hình ảnh sản phẩm</label>
                        <input v-model="newProdImage" type="text" class="input input-bordered input-sm w-full bg-white text-xs" placeholder="https://..." />
                    </div>
                    <div class="col-span-2">
                        <label class="block font-bold text-gray-600 mb-1">Mô tả/Công dụng</label>
                        <textarea v-model="newProdUsage" rows="2" class="textarea textarea-bordered w-full bg-white text-xs"></textarea>
                    </div>
                    <div class="col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button type="button" @click="showNewProductModal = false" class="btn btn-ghost btn-sm">Hủy</button>
                        <button type="submit" :disabled="isSavingProduct" class="btn btn-primary btn-sm px-6">
                            Lưu sản phẩm
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- NEW BRAND QUICK MODAL -->
        <div v-if="showNewBrandModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-xs">
            <div class="bg-[#FAF8F5] border border-[#EBE7DF] rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-left">
                <button @click="showNewBrandModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                <h3 class="font-serif text-base text-[#064E3B] font-bold mb-4">➕ Thêm nhãn hàng mới nhanh</h3>
                
                <form @submit.prevent="saveBrand" class="space-y-3">
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Tên nhãn hàng *</label>
                        <input v-model="newBrandName" type="text" class="input input-bordered input-sm w-full bg-white text-xs" required />
                    </div>
                    <div>
                        <label class="block font-bold text-gray-600 mb-1">Mô tả nhãn hàng</label>
                        <textarea v-model="newBrandDescription" rows="2" class="textarea textarea-bordered w-full bg-white text-xs" placeholder="Xuất xứ, phân khúc..."></textarea>
                    </div>
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" @click="showNewBrandModal = false" class="btn btn-ghost btn-sm">Hủy</button>
                        <button type="submit" :disabled="isSavingBrand" class="btn btn-primary btn-sm px-6">
                            Lưu nhãn hàng
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </AdminLayout>
</template>
