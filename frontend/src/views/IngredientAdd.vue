<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-4 mb-6">
          <RouterLink to="/ingredients" class="btn btn-circle btn-ghost bg-white border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </RouterLink>
          <h1 class="text-3xl font-bold text-gray-900">Thêm Thành Phần Mới</h1>
        </div>

        <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form @submit.prevent="submitForm" class="space-y-6">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Tên thành phần <span class="text-error">*</span></span></label>
              <input type="text" v-model="formData.name" class="input input-bordered w-full" placeholder="VD: Niacinamide" required />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Mô tả chi tiết</span></label>
              <textarea v-model="formData.description" class="textarea textarea-bordered h-24" placeholder="Mô tả về nguồn gốc, đặc tính..."></textarea>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Công dụng chính</span></label>
              <textarea v-model="formData.benefits" class="textarea textarea-bordered h-24" placeholder="VD: Làm sáng da, mờ thâm..."></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Mức độ an toàn</span></label>
                <select v-model="formData.safety_level" class="select select-bordered w-full">
                  <option value="" disabled>-- Chọn mức độ --</option>
                  <option value="An toàn (Xanh)">An toàn (Xanh)</option>
                  <option value="Trung bình (Vàng)">Trung bình (Vàng)</option>
                  <option value="Nguy hiểm (Đỏ)">Nguy hiểm (Đỏ)</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Hình ảnh minh họa (URL)</span></label>
                <input type="text" v-model="formData.image_url" class="input input-bordered w-full" placeholder="https://..." />
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-4">
              <RouterLink to="/ingredients" class="btn btn-ghost">Hủy</RouterLink>
              <button type="submit" class="btn btn-primary px-8" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="loading loading-spinner"></span>
                Lưu Thành Phần
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
import { useRouter } from 'vue-router';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import IngredientService from '../services/ingredient.service';
import { push } from 'notivue';

const ingredientService = new IngredientService();
const router = useRouter();

const formData = ref({
  name: '',
  description: '',
  benefits: '',
  safety_level: '',
  image_url: ''
});

const isSubmitting = ref(false);

const submitForm = async () => {
  if (!formData.value.name) {
    push.warning("Vui lòng nhập tên thành phần!");
    return;
  }
  
  try {
    isSubmitting.value = true;
    await ingredientService.createIngredient(formData.value);
    push.success("Đã thêm thành phần thành công!");
    router.push('/ingredients');
  } catch (error) {
    console.error(error);
    push.error("Có lỗi xảy ra khi thêm thành phần");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  if (role !== "STAFF" && role !== "ADMIN") {
    router.push("/");
  }
});
</script>
