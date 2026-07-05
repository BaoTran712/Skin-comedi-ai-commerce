<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Quản lý Quảng Cáo</h1>
          <p class="text-gray-500 mt-1">Danh sách các banner và quảng cáo trên hệ thống</p>
        </div>
        <RouterLink to="/banner/add" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Banner
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-gray-50">
              <tr>
                <th>Hình ảnh</th>
                <th>Tiêu đề</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="banners.length === 0">
                <td colspan="5" class="text-center py-8 text-gray-500">Chưa có banner nào.</td>
              </tr>
              <tr v-for="item in banners" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td>
                  <div class="w-32 h-16 rounded overflow-hidden shadow-sm bg-gray-100">
                    <img v-if="item.duong_dan_anh" :src="item.duong_dan_anh" alt="Banner" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                  </div>
                </td>
                <td class="font-medium text-gray-800">{{ item.tieu_de }}</td>
                <td><span class="badge badge-outline">{{ item.vi_tri || 'Mặc định' }}</span></td>
                <td>
                  <span class="badge" :class="item.trang_thai === 'active' ? 'badge-success' : 'badge-ghost'">
                    {{ item.trang_thai === 'active' ? 'Hoạt động' : 'Đang tắt' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-2">
                    <RouterLink :to="`/banner/edit/${item.id}`" class="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50">
                      Sửa
                    </RouterLink>
                    <button @click="deleteBanner(item.id)" class="btn btn-sm btn-ghost text-red-600 hover:bg-red-50">
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
import BannerService from '../services/banner.service';
import { push } from 'notivue';

const bannerService = new BannerService();
const banners = ref([]);
const router = useRouter();

const fetchBanners = async () => {
  try {
    banners.value = await bannerService.getAllBanners();
  } catch (error) {
    console.error(error);
    push.error('Không thể tải danh sách banner');
  }
};

const deleteBanner = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa banner này?')) {
    try {
      await bannerService.deleteBanner(id);
      push.success('Xóa banner thành công!');
      fetchBanners();
    } catch (error) {
      console.error(error);
      push.error('Có lỗi xảy ra khi xóa banner');
    }
  }
};

onMounted(() => {
  const role = localStorage.getItem("role");
  if (role !== "staff") {
    router.push("/");
    return;
  }
  fetchBanners();
});
</script>
