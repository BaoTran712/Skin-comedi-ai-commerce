<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Hộp Thư Liên Hệ</h1>
        <p class="text-gray-500 mt-1">Danh sách tin nhắn liên hệ và góp ý từ khách hàng</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-gray-50">
              <tr>
                <th>Khách hàng</th>
                <th>Thông tin liên hệ</th>
                <th>Tiêu đề</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="contacts.length === 0">
                <td colspan="6" class="text-center py-8 text-gray-500">Hộp thư trống.</td>
              </tr>
              <tr v-for="item in contacts" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="font-medium text-gray-800">{{ item.ho_ten }}</td>
                <td class="text-sm text-gray-600">
                  <div>{{ item.email }}</div>
                  <div class="text-xs text-gray-400">{{ item.so_dien_thoai }}</div>
                </td>
                <td class="max-w-xs truncate" :title="item.tieu_de">{{ item.tieu_de }}</td>
                <td class="text-xs text-gray-500">{{ formatDate(item.ngay_gui) }}</td>
                <td>
                  <span class="badge" :class="item.trang_thai === 'processed' ? 'badge-success' : 'badge-warning'">
                    {{ item.trang_thai === 'processed' ? 'Đã xử lý' : 'Chờ xử lý' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-2">
                    <RouterLink :to="`/contact/detail/${item.id}`" class="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50">
                      Xem & Xử lý
                    </RouterLink>
                    <button @click="deleteContact(item.id)" class="btn btn-sm btn-ghost text-red-600 hover:bg-red-50">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
import ContactService from '../services/contact.service';
import { push } from 'notivue';

const contactService = new ContactService();
const contacts = ref([]);
const router = useRouter();

const fetchContacts = async () => {
  try {
    contacts.value = await contactService.getAllContacts();
  } catch (error) {
    console.error(error);
    push.error('Không thể tải danh sách liên hệ');
  }
};

const deleteContact = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
    try {
      await contactService.deleteContact(id);
      push.success('Xóa tin nhắn thành công!');
      fetchContacts();
    } catch (error) {
      console.error(error);
      push.error('Có lỗi xảy ra khi xóa tin nhắn');
    }
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
  fetchContacts();
});
</script>
