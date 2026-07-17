<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import InputSearch from "../components/InputSearch.vue";
import { ref, computed, onMounted } from "vue";
import SupplierService from "../services/supplier.service";
import { push } from "notivue";

const supplierService = new SupplierService();
const suppliers = ref([]);
const searchText = ref("");
const showAddModal = ref(false);
const editMode = ref(false);

const formData = ref({
    _id: null,
    name: "",
    address: "",
    phone: "",
    email: "",
    status: "active"
});

const fetchSuppliers = async () => {
    try {
        suppliers.value = await supplierService.getAllSuppliers();
    } catch (error) {
        console.error("Lỗi khi tải nhà cung cấp", error);
    }
};

onMounted(() => {
    fetchSuppliers();
});

const filteredSuppliers = computed(() => {
    if (!searchText.value) return suppliers.value;
    const kw = searchText.value.toLowerCase();
    return suppliers.value.filter(s => 
        (s.name && s.name.toLowerCase().includes(kw)) ||
        (s.phone && s.phone.toLowerCase().includes(kw)) ||
        (s.email && s.email.toLowerCase().includes(kw))
    );
});

const openAddModal = () => {
    editMode.value = false;
    formData.value = { _id: null, name: "", address: "", phone: "", email: "", status: "active" };
    showAddModal.value = true;
};

const openEditModal = (supplier) => {
    editMode.value = true;
    formData.value = { ...supplier };
    showAddModal.value = true;
};

const saveSupplier = async () => {
    if (!formData.value.name) {
        push.error("Tên nhà cung cấp là bắt buộc!");
        return;
    }
    
    try {
        if (editMode.value) {
            await supplierService.updateSupplier(formData.value._id, formData.value);
            push.success("Cập nhật thành công!");
        } else {
            await supplierService.createSupplier(formData.value);
            push.success("Thêm nhà cung cấp thành công!");
        }
        showAddModal.value = false;
        fetchSuppliers();
    } catch (error) {
        push.error(editMode.value ? "Lỗi khi cập nhật" : "Lỗi khi thêm mới");
    }
};

const deleteSupplier = async (id) => {
    if (confirm("Bạn có chắc muốn xóa nhà cung cấp này?")) {
        try {
            await supplierService.deleteSupplier(id);
            push.success("Xóa thành công!");
            fetchSuppliers();
        } catch (error) {
            push.error("Lỗi khi xóa nhà cung cấp");
        }
    }
};
</script>

<template>
    <AdminLayout>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div>
                <h1 class="text-xl font-bold text-gray-800">Quản lý Nhà cung cấp</h1>
                <p class="text-xs text-gray-500">Danh sách các đối tác và nguồn hàng của bạn</p>
            </div>
            <div class="flex items-center gap-2">
                <InputSearch v-model="searchText" placeholder="Tìm tên, SĐT, Email..." class="w-64 input-sm h-8" />
                <button class="btn btn-primary btn-sm h-8 min-h-0" @click="openAddModal">+ Thêm Mới</button>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table class="table table-sm table-zebra w-full text-xs">
                <thead class="bg-gray-50 text-gray-600 text-xs">
                    <tr>
                        <th>Tên Nhà Cung Cấp</th>
                        <th>Liên hệ</th>
                        <th>Địa chỉ</th>
                        <th>Trạng thái</th>
                        <th class="text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="supplier in filteredSuppliers" :key="supplier._id">
                        <td class="font-bold text-gray-800">{{ supplier.name }}</td>
                        <td>
                            <div>{{ supplier.phone || '---' }}</div>
                            <div class="text-[10px] text-gray-500">{{ supplier.email || '---' }}</div>
                        </td>
                        <td class="max-w-[200px] truncate" :title="supplier.address">{{ supplier.address || '---' }}</td>
                        <td>
                            <span class="badge badge-sm" :class="supplier.status === 'active' ? 'badge-success text-white' : 'badge-ghost'">
                                {{ supplier.status === 'active' ? 'Hoạt động' : 'Tạm dừng' }}
                            </span>
                        </td>
                        <td class="text-right">
                            <button @click="openEditModal(supplier)" class="btn btn-ghost btn-xs text-blue-500">Sửa</button>
                            <button @click="deleteSupplier(supplier._id)" class="btn btn-ghost btn-xs text-red-500">Xóa</button>
                        </td>
                    </tr>
                    <tr v-if="filteredSuppliers.length === 0">
                        <td colspan="5" class="text-center py-8 text-gray-500">Không tìm thấy nhà cung cấp nào.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal Thêm/Sửa -->
        <dialog class="modal" :class="{'modal-open': showAddModal}">
            <div class="modal-box bg-white">
                <h3 class="font-bold text-lg mb-4">{{ editMode ? 'Cập nhật Nhà cung cấp' : 'Thêm Nhà cung cấp mới' }}</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="label"><span class="label-text font-bold">Tên nhà cung cấp *</span></label>
                        <input type="text" v-model="formData.name" class="input input-bordered input-sm w-full bg-white" placeholder="VD: Công ty TNHH Mỹ Phẩm X" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="label"><span class="label-text font-bold">Số điện thoại</span></label>
                            <input type="text" v-model="formData.phone" class="input input-bordered input-sm w-full bg-white" />
                        </div>
                        <div>
                            <label class="label"><span class="label-text font-bold">Email</span></label>
                            <input type="email" v-model="formData.email" class="input input-bordered input-sm w-full bg-white" />
                        </div>
                    </div>
                    <div>
                        <label class="label"><span class="label-text font-bold">Địa chỉ</span></label>
                        <input type="text" v-model="formData.address" class="input input-bordered input-sm w-full bg-white" />
                    </div>
                    <div>
                        <label class="label"><span class="label-text font-bold">Trạng thái</span></label>
                        <select v-model="formData.status" class="select select-bordered select-sm w-full bg-white">
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Tạm dừng</option>
                        </select>
                    </div>
                </div>

                <div class="modal-action">
                    <button class="btn btn-ghost btn-sm" @click="showAddModal = false">Hủy</button>
                    <button class="btn btn-primary btn-sm" @click="saveSupplier">Lưu lại</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop" @click="showAddModal = false">
                <button>close</button>
            </form>
        </dialog>
    </AdminLayout>
</template>
