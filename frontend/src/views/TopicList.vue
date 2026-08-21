<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Quản lý Chủ Đề</h1>
          <p class="text-gray-500 mt-1">Các nhóm chủ đề tư vấn, cẩm nang chăm sóc da</p>
        </div>
        <RouterLink to="/topic/add" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Chủ Đề
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-gray-50">
              <tr>
                <th>Tên chủ đề</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="topics.length === 0">
                <td colspan="4" class="text-center py-8 text-gray-500">Chưa có chủ đề nào.</td>
              </tr>
              <tr v-for="item in topics" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="font-medium text-gray-800">{{ item.ten }}</td>
                <td class="text-sm text-gray-500">{{ formatDate(item.ngay_tao) }}</td>
                <td>
                  <span class="badge" :class="item.trang_thai === 'active' ? 'badge-success' : 'badge-ghost'">
                    {{ item.trang_thai === 'active' ? 'Hiển thị' : 'Đang ẩn' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-2">
                    <RouterLink :to="`/topic/edit/${item.id}`" class="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50">
                      Sửa
                    </RouterLink>
                    <button @click="deleteTopic(item.id)" class="btn btn-sm btn-ghost text-red-600 hover:bg-red-50">
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
import TopicService from '../services/topic.service';
import { push } from 'notivue';

const topicService = new TopicService();
const topics = ref([]);
const router = useRouter();

const fetchTopics = async () => {
  try {
    topics.value = await topicService.getAllTopics();
  } catch (error) {
    console.error(error);
    push.error('Không thể tải danh sách chủ đề');
  }
};

const deleteTopic = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa chủ đề này?')) {
    try {
      await topicService.deleteTopic(id);
      push.success('Xóa chủ đề thành công!');
      fetchTopics();
    } catch (error) {
      console.error(error);
      push.error('Có lỗi xảy ra khi xóa chủ đề');
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

onMounted(() => {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  if (role !== "STAFF" && role !== "ADMIN") {
    router.push("/");
    return;
  }
  fetchTopics();
});
</script>
