<template>
  <AdminLayout>
    <div class="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Cấu Hình Bình Luận</h1>
        <p class="text-gray-500 mt-1">Tuỳ chỉnh cách người dùng thảo luận và đánh giá trên website</p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="bg-white p-6 rounded-2xl h-96 skeleton"></div>

      <!-- Settings Content -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form @submit.prevent="saveSettings" class="p-8 space-y-8">
          
          <!-- 1. Chọn công cụ bình luận -->
          <div class="space-y-4">
            <h2 class="text-lg font-bold text-gray-800 border-b pb-2">1. Chọn công cụ bình luận</h2>
            <div class="flex flex-col gap-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="radio" v-model="settings.comment_type" value="system" class="radio radio-primary" />
                <span class="font-medium text-gray-700">Bình luận của hệ thống (Mặc định)</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="radio" v-model="settings.comment_type" value="facebook" class="radio radio-primary" />
                <span class="font-medium text-gray-700">Bình luận Facebook</span>
              </label>
            </div>
          </div>

          <!-- 2. Cho phép bình luận -->
          <div class="space-y-4">
            <h2 class="text-lg font-bold text-gray-800 border-b pb-2">2. Cho phép bình luận</h2>
            <div class="flex flex-col gap-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.comment_on_product" class="checkbox checkbox-primary" />
                <span class="font-medium text-gray-700">Trang chi tiết sản phẩm</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.comment_on_post" class="checkbox checkbox-primary" />
                <span class="font-medium text-gray-700">Trang bài viết (Blog)</span>
              </label>
            </div>
          </div>

          <!-- 3. Cấu hình bình luận hệ thống -->
          <div v-if="settings.comment_type === 'system'" class="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h2 class="text-lg font-bold text-gray-800 mb-4">3. Cấu hình bình luận hệ thống</h2>
            <div class="flex flex-col gap-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.comment_require_approval" class="checkbox checkbox-primary" />
                <span class="font-medium text-gray-700">Bình luận phải được kiểm duyệt trước khi hiển thị</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.comment_allow_rating" class="checkbox checkbox-primary" />
                <span class="font-medium text-gray-700">Cho phép đánh giá (Rating) sao ở phần bình luận</span>
              </label>
            </div>
          </div>

          <!-- 4. Cấu hình Facebook -->
          <div v-if="settings.comment_type === 'facebook'" class="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h2 class="text-lg font-bold text-blue-900 mb-4">Cấu hình Facebook</h2>
            <div class="form-control w-full max-w-md">
              <label class="label"><span class="label-text font-bold text-blue-800">Facebook App ID</span></label>
              <input type="text" v-model="settings.fb_app_id" placeholder="Nhập App ID để kiểm duyệt bình luận" class="input input-bordered w-full" />
              <label class="label"><span class="label-text-alt text-blue-600">Bạn cần tạo App trên developer.facebook.com để lấy ID này.</span></label>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-6 border-t border-gray-100 flex justify-end">
            <button type="submit" class="btn btn-primary px-8" :disabled="isSaving">
              <span v-if="isSaving" class="loading loading-spinner"></span>
              {{ isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '../components/AdminLayout.vue';
import SettingService from '../services/setting.service';
import { push } from 'notivue';

const router = useRouter();
const settingService = new SettingService();
const isLoading = ref(true);
const isSaving = ref(false);

const rawSettings = ref([]);
const settings = ref({
  comment_type: 'system',
  comment_on_product: true,
  comment_on_post: true,
  comment_require_approval: false,
  comment_allow_rating: true,
  fb_app_id: ''
});

const parseBoolean = (val) => val === 'true' || val === true;

const loadSettings = async () => {
  try {
    isLoading.value = true;
    const data = await settingService.getAllSettings();
    rawSettings.value = data;
    
    // Map data to local state
    data.forEach(item => {
      if (item.khoa_cau_hinh === 'comment_type') settings.value.comment_type = item.gia_tri;
      if (item.khoa_cau_hinh === 'comment_on_product') settings.value.comment_on_product = parseBoolean(item.gia_tri);
      if (item.khoa_cau_hinh === 'comment_on_post') settings.value.comment_on_post = parseBoolean(item.gia_tri);
      if (item.khoa_cau_hinh === 'comment_require_approval') settings.value.comment_require_approval = parseBoolean(item.gia_tri);
      if (item.khoa_cau_hinh === 'comment_allow_rating') settings.value.comment_allow_rating = parseBoolean(item.gia_tri);
      if (item.khoa_cau_hinh === 'fb_app_id') settings.value.fb_app_id = item.gia_tri;
    });
  } catch (error) {
    console.error(error);
    push.error('Lỗi khi tải cấu hình');
  } finally {
    isLoading.value = false;
  }
};

const saveSettings = async () => {
  try {
    isSaving.value = true;
    
    // Update each setting if it exists, or create if not
    const updates = Object.keys(settings.value).map(async (key) => {
      const existing = rawSettings.value.find(s => s.khoa_cau_hinh === key);
      const valueToSave = typeof settings.value[key] === 'boolean' ? String(settings.value[key]) : settings.value[key];
      
      if (existing) {
        return settingService.updateSetting(existing.id, { gia_tri: valueToSave });
      } else {
        return settingService.createSetting({ khoa_cau_hinh: key, gia_tri: valueToSave, mo_ta: 'Tự động tạo' });
      }
    });
    
    await Promise.all(updates);
    push.success('Đã lưu cấu hình bình luận!');
    await loadSettings();
  } catch (error) {
    console.error(error);
    push.error('Lỗi khi lưu cấu hình');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  const role = localStorage.getItem("role");
  if (role !== "staff") {
    router.push("/");
    return;
  }
  loadSettings();
});
</script>
