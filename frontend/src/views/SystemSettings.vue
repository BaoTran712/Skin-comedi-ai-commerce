<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">⚙️ Cấu Hình Hệ Thống</h1>
        <p class="text-gray-500 mt-1">Quản lý các thông số chung của website Testskin</p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-4">
        <div v-for="i in 5" :key="i" class="bg-white p-6 rounded-2xl h-20 skeleton"></div>
      </div>

      <!-- Settings table -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
          <span class="font-bold text-gray-700">Danh sách cài đặt</span>
          <button @click="showAddModal = true" class="btn btn-primary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Thêm cài đặt
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-gray-50">
              <tr>
                <th>Khóa (Key)</th>
                <th>Giá trị (Value)</th>
                <th>Mô tả</th>
                <th class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="settings.length === 0">
                <td colspan="4" class="text-center py-8 text-gray-500">Chưa có cài đặt nào.</td>
              </tr>
              <tr v-for="item in settings" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td><code class="bg-gray-100 px-2 py-1 rounded text-sm text-purple-700 font-mono">{{ item.khoa_cau_hinh }}</code></td>
                <td>
                  <span v-if="editingId !== item.id" class="text-gray-800">{{ item.gia_tri }}</span>
                  <input v-else v-model="editValue" class="input input-bordered input-sm w-full" @keydown.enter="saveEdit(item)" @keydown.esc="cancelEdit" />
                </td>
                <td class="text-gray-500 text-sm">{{ item.mo_ta || '—' }}</td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button v-if="editingId !== item.id" @click="startEdit(item)" class="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50">Sửa</button>
                    <button v-else @click="saveEdit(item)" class="btn btn-sm btn-success text-white">Lưu</button>
                    <button v-if="editingId !== item.id" @click="deleteSetting(item.id)" class="btn btn-sm btn-ghost text-red-600 hover:bg-red-50">Xóa</button>
                    <button v-else @click="cancelEdit" class="btn btn-sm btn-ghost">Hủy</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Thêm cài đặt -->
      <div v-if="showAddModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <h2 class="text-xl font-bold mb-6">Thêm Cài Đặt Mới</h2>
          <div class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Khóa (Key) <span class="text-error">*</span></span></label>
              <input v-model="newSetting.khoa_cau_hinh" class="input input-bordered w-full font-mono" placeholder="VD: site_name" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Giá trị (Value) <span class="text-error">*</span></span></label>
              <input v-model="newSetting.gia_tri" class="input input-bordered w-full" placeholder="VD: Testskin" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Mô tả</span></label>
              <input v-model="newSetting.mo_ta" class="input input-bordered w-full" placeholder="VD: Tên website" />
            </div>
          </div>
          <div class="flex justify-end gap-4 mt-8">
            <button @click="showAddModal = false" class="btn btn-ghost">Hủy</button>
            <button @click="addSetting" class="btn btn-primary px-8" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              Lưu
            </button>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import SettingService from '../services/setting.service';
import { push } from 'notivue';

const settingService = new SettingService();
const settings = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const router = useRouter();

const editingId = ref(null);
const editValue = ref('');
const showAddModal = ref(false);
const newSetting = ref({ khoa_cau_hinh: '', gia_tri: '', mo_ta: '' });

const fetchSettings = async () => {
  try {
    isLoading.value = true;
    settings.value = await settingService.getAllSettings();
  } catch (error) {
    console.error(error);
    push.error('Không thể tải cấu hình hệ thống');
  } finally {
    isLoading.value = false;
  }
};

const startEdit = (item) => {
  editingId.value = item.id;
  editValue.value = item.gia_tri;
};

const cancelEdit = () => {
  editingId.value = null;
  editValue.value = '';
};

const saveEdit = async (item) => {
  try {
    await settingService.updateSetting(item.id, { ...item, gia_tri: editValue.value });
    push.success('Cập nhật cài đặt thành công!');
    cancelEdit();
    fetchSettings();
  } catch (error) {
    console.error(error);
    push.error('Có lỗi khi cập nhật cài đặt');
  }
};

const addSetting = async () => {
  if (!newSetting.value.khoa_cau_hinh || !newSetting.value.gia_tri) {
    push.warning('Vui lòng điền đầy đủ Khóa và Giá trị!');
    return;
  }
  try {
    isSubmitting.value = true;
    await settingService.createSetting(newSetting.value);
    push.success('Thêm cài đặt thành công!');
    showAddModal.value = false;
    newSetting.value = { khoa_cau_hinh: '', gia_tri: '', mo_ta: '' };
    fetchSettings();
  } catch (error) {
    console.error(error);
    push.error('Có lỗi khi thêm cài đặt');
  } finally {
    isSubmitting.value = false;
  }
};

const deleteSetting = async (id) => {
  if (confirm('Bạn có chắc muốn xóa cài đặt này?')) {
    try {
      await settingService.deleteSetting(id);
      push.success('Xóa cài đặt thành công!');
      fetchSettings();
    } catch (error) {
      console.error(error);
      push.error('Có lỗi khi xóa cài đặt');
    }
  }
};

onMounted(() => {
  const role = localStorage.getItem('role');
  if (role !== 'staff') {
    router.push('/');
    return;
  }
  fetchSettings();
});
</script>
