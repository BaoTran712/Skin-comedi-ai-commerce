<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-4 mb-6">
          <RouterLink to="/topics" class="btn btn-circle btn-ghost bg-white border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </RouterLink>
          <h1 class="text-3xl font-bold text-gray-900">Thêm Chủ Đề Mới</h1>
        </div>

        <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form @submit.prevent="submitForm" class="space-y-6">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Tên chủ đề <span class="text-error">*</span></span></label>
              <input type="text" v-model="formData.ten" class="input input-bordered w-full" placeholder="VD: Routine chăm sóc da mụn" required />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold">Trạng thái hiển thị</span></label>
              <select v-model="formData.trang_thai" class="select select-bordered w-full">
                <option value="active">Hiển thị</option>
                <option value="inactive">Ẩn</option>
              </select>
            </div>

            <div class="pt-4 flex justify-end gap-4">
              <RouterLink to="/topics" class="btn btn-ghost">Hủy</RouterLink>
              <button type="submit" class="btn btn-primary px-8" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="loading loading-spinner"></span>
                Lưu Chủ Đề
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
import TopicService from '../services/topic.service';
import { push } from 'notivue';

const topicService = new TopicService();
const router = useRouter();

const formData = ref({
  ten: '',
  trang_thai: 'active'
});

const isSubmitting = ref(false);

const submitForm = async () => {
  if (!formData.value.ten) {
    push.warning("Vui lòng nhập tên chủ đề!");
    return;
  }
  
  try {
    isSubmitting.value = true;
    await topicService.createTopic(formData.value);
    push.success("Đã thêm chủ đề thành công!");
    router.push('/topics');
  } catch (error) {
    console.error(error);
    push.error("Có lỗi xảy ra khi thêm chủ đề");
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
