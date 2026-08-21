<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-4 mb-6">
          <RouterLink to="/banners" class="btn btn-circle btn-ghost bg-white border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </RouterLink>
          <h1 class="text-3xl font-bold text-gray-900">Chỉnh Sửa Banner</h1>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div v-else class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form @submit.prevent="submitForm" class="space-y-6">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Tiêu đề Banner <span class="text-error">*</span></span></label>
              <input type="text" v-model="formData.tieu_de" class="input input-bordered w-full" required />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Hình ảnh (URL) <span class="text-error">*</span></span></label>
              <input type="text" v-model="formData.duong_dan_anh" class="input input-bordered w-full" required />
              
              <div v-if="formData.duong_dan_anh" class="mt-4 w-full h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <img :src="formData.duong_dan_anh" alt="Preview" class="w-full h-full object-cover" @error="handleImageError" />
              </div>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Đường dẫn liên kết (Link đích)</span></label>
              <input type="text" v-model="formData.duong_dan_lien_ket" class="input input-bordered w-full" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Vị trí</span></label>
                <select v-model="formData.vi_tri" class="select select-bordered w-full">
                  <option value="Trang chủ (Top)">Trang chủ (Top)</option>
                  <option value="Trang chủ (Giữa)">Trang chủ (Giữa)</option>
                  <option value="Popup">Popup</option>
                  <option value="Sidebar">Sidebar</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Trạng thái</span></label>
                <select v-model="formData.trang_thai" class="select select-bordered w-full">
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Đang tắt</option>
                </select>
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-4">
              <RouterLink to="/banners" class="btn btn-ghost">Hủy</RouterLink>
              <button type="submit" class="btn btn-primary px-8" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="loading loading-spinner"></span>
                Cập Nhật
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import BannerService from '../services/banner.service';
import { push } from 'notivue';

const bannerService = new BannerService();
const router = useRouter();
const route = useRoute();
const id = route.params.id;

const formData = ref({
  tieu_de: '',
  duong_dan_anh: '',
  duong_dan_lien_ket: '',
  vi_tri: 'Trang chủ (Top)',
  trang_thai: 'active'
});

const isSubmitting = ref(false);
const isLoading = ref(true);

const handleImageError = (e) => {
  e.target.style.display = 'none';
};

const fetchBanner = async () => {
  try {
    const data = await bannerService.getBannerById(id);
    formData.value = {
      tieu_de: data.tieu_de || '',
      duong_dan_anh: data.duong_dan_anh || '',
      duong_dan_lien_ket: data.duong_dan_lien_ket || '',
      vi_tri: data.vi_tri || 'Trang chủ (Top)',
      trang_thai: data.trang_thai || 'active'
    };
  } catch (error) {
    console.error(error);
    push.error("Không tìm thấy dữ liệu banner!");
    router.push('/banners');
  } finally {
    isLoading.value = false;
  }
};

const submitForm = async () => {
  if (!formData.value.tieu_de || !formData.value.duong_dan_anh) {
    push.warning("Vui lòng nhập tiêu đề và link ảnh!");
    return;
  }
  
  try {
    isSubmitting.value = true;
    await bannerService.updateBanner(id, formData.value);
    push.success("Cập nhật banner thành công!");
    router.push('/banners');
  } catch (error) {
    console.error(error);
    push.error("Có lỗi xảy ra khi cập nhật banner");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  if (role !== "STAFF" && role !== "ADMIN") {
    router.push("/");
    return;
  }
  fetchBanner();
});
</script>
