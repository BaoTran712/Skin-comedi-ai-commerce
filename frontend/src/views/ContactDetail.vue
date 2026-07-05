<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-4 mb-6">
          <RouterLink to="/contacts" class="btn btn-circle btn-ghost bg-white border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </RouterLink>
          <h1 class="text-3xl font-bold text-gray-900">Chi Tiết Liên Hệ</h1>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div v-else class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div class="border-b pb-4 flex justify-between items-start">
            <div>
              <h2 class="text-xl font-bold text-gray-800">{{ contact.ho_ten }}</h2>
              <p class="text-sm text-gray-500 mt-1">Gửi lúc: {{ formatDate(contact.ngay_gui) }}</p>
            </div>
            <span class="badge" :class="contact.trang_thai === 'processed' ? 'badge-success' : 'badge-warning'">
              {{ contact.trang_thai === 'processed' ? 'Đã xử lý' : 'Chờ xử lý' }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-sm">
            <div>
              <span class="font-bold text-gray-500">Email:</span> 
              <a :href="`mailto:${contact.email}`" class="text-primary hover:underline ml-1">{{ contact.email }}</a>
            </div>
            <div>
              <span class="font-bold text-gray-500">Số điện thoại:</span> 
              <a :href="`tel:${contact.so_dien_thoai}`" class="text-primary hover:underline ml-1">{{ contact.so_dien_thoai }}</a>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="font-bold text-gray-500">Tiêu đề:</h3>
            <p class="text-lg font-bold text-gray-900">{{ contact.tieu_de }}</p>
          </div>

          <div class="space-y-2">
            <h3 class="font-bold text-gray-500">Nội dung tin nhắn:</h3>
            <div class="bg-gray-50 p-6 rounded-2xl text-gray-800 whitespace-pre-line border border-gray-100">
              {{ contact.noi_dung }}
            </div>
          </div>

          <div class="pt-6 border-t flex justify-between items-center">
            <button v-if="contact.trang_thai !== 'processed'" @click="markAsProcessed" class="btn btn-success text-white">
              Đánh dấu Đã xử lý
            </button>
            <span v-else class="text-success flex items-center gap-2 font-bold">
              ✔ Đã hoàn tất xử lý liên hệ này
            </span>
            <RouterLink to="/contacts" class="btn btn-ghost">Quay lại</RouterLink>
          </div>
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
import ContactService from '../services/contact.service';
import { push } from 'notivue';

const contactService = new ContactService();
const router = useRouter();
const route = useRoute();
const id = route.params.id;

const contact = ref({});
const isLoading = ref(true);

const fetchContact = async () => {
  try {
    contact.value = await contactService.getContactById(id);
  } catch (error) {
    console.error(error);
    push.error("Không tìm thấy thư liên hệ này!");
    router.push('/contacts');
  } finally {
    isLoading.value = false;
  }
};

const markAsProcessed = async () => {
  try {
    await contactService.updateContactStatus(id, 'processed');
    push.success("Đã cập nhật trạng thái xử lý!");
    fetchContact();
  } catch (error) {
    console.error(error);
    push.error("Có lỗi xảy ra khi cập nhật trạng thái");
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN');
};

onMounted(() => {
  const role = localStorage.getItem("role");
  if (role !== "staff") {
    router.push("/");
    return;
  }
  fetchContact();
});
</script>
