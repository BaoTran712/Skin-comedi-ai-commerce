<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">📋 Lịch Sử Hoạt Động</h1>
          <p class="text-gray-500 mt-1">Theo dõi các thao tác của nhân viên trên hệ thống</p>
        </div>
        <button @click="clearAll" class="btn btn-error btn-outline btn-sm">
          🗑 Xóa toàn bộ log
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 8" :key="i" class="bg-white p-4 rounded-xl h-16 skeleton"></div>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-gray-50">
              <tr>
                <th>Thời gian</th>
                <th>Nhân viên</th>
                <th>Hành động</th>
                <th>Chi tiết</th>
                <th class="text-center">Xóa</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="logs.length === 0">
                <td colspan="5" class="text-center py-8 text-gray-500">Chưa có lịch sử hoạt động nào.</td>
              </tr>
              <tr v-for="item in logs" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDate(item.thoi_gian) }}</td>
                <td class="font-medium text-gray-800">{{ item.nhanvien_id?.username || item.nhanvien_id || '—' }}</td>
                <td>
                  <span class="badge badge-ghost font-mono text-xs">{{ item.hanh_dong }}</span>
                </td>
                <td class="text-sm text-gray-600 max-w-xs truncate" :title="item.mo_ta_chi_tiet">
                  {{ item.mo_ta_chi_tiet || '—' }}
                </td>
                <td class="text-center">
                  <button @click="deleteLog(item.id)" class="btn btn-sm btn-ghost text-red-500 hover:bg-red-50">✕</button>
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
import ActivityLogService from '../services/activitylog.service';
import { push } from 'notivue';

const activityLogService = new ActivityLogService();
const logs = ref([]);
const isLoading = ref(true);
const router = useRouter();

const fetchLogs = async () => {
  try {
    isLoading.value = true;
    logs.value = await activityLogService.getAllLogs();
  } catch (error) {
    console.error(error);
    push.error('Không thể tải lịch sử hoạt động');
  } finally {
    isLoading.value = false;
  }
};

const deleteLog = async (id) => {
  try {
    await activityLogService.deleteLog(id);
    push.success('Đã xóa dòng log!');
    fetchLogs();
  } catch (error) {
    push.error('Có lỗi khi xóa log');
  }
};

const clearAll = async () => {
  if (confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử hoạt động? Hành động này không thể hoàn tác!')) {
    try {
      await activityLogService.clearAllLogs();
      push.success('Đã xóa toàn bộ lịch sử hoạt động!');
      fetchLogs();
    } catch (error) {
      push.error('Có lỗi khi xóa log');
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN');
};

onMounted(() => {
  const role = localStorage.getItem('role');
  if (role !== 'staff') {
    router.push('/');
    return;
  }
  fetchLogs();
});
</script>
