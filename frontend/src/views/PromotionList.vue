<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Quản lý Khuyến Mãi</h1>
          <p class="text-gray-500 mt-1">Danh sách các mã giảm giá và chương trình khuyến mãi</p>
        </div>
        <RouterLink to="/promotion/add" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Khuyến Mãi
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-gray-50">
              <tr>
                <th>Mã</th>
                <th>Tên chương trình</th>
                <th>Loại giảm giá</th>
                <th>Giá trị giảm</th>
                <th>Thời gian</th>
                <th>Đã dùng / Giới hạn</th>
                <th>Trạng thái</th>
                <th class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="promotions.length === 0">
                <td colspan="8" class="text-center py-8 text-gray-500">Chưa có mã khuyến mãi nào.</td>
              </tr>
              <tr v-for="item in promotions" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td><span class="badge badge-primary font-mono font-bold">{{ item.ma_khuyen_mai }}</span></td>
                <td class="font-medium text-gray-800">{{ item.ten }}</td>
                <td>{{ item.loai_giam_gia === 'percentage' ? 'Phần trăm (%)' : 'Số tiền cố định' }}</td>
                <td class="font-bold text-gray-900">
                  {{ item.loai_giam_gia === 'percentage' ? item.gia_tri_giam + '%' : formatPrice(item.gia_tri_giam) }}
                </td>
                <td class="text-xs text-gray-500">
                  {{ formatDate(item.ngay_bat_dau) }} - {{ formatDate(item.ngay_ket_thuc) }}
                </td>
                <td>{{ item.so_lan_da_dung || 0 }} / {{ item.gioi_han_su_dung || 'Vô hạn' }}</td>
                <td>
                  <span class="badge" :class="item.trang_thai === 'active' ? 'badge-success' : 'badge-ghost'">
                    {{ item.trang_thai === 'active' ? 'Đang chạy' : 'Đã dừng' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-2">
                    <RouterLink :to="`/promotion/edit/${item.id}`" class="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50">
                      Sửa
                    </RouterLink>
                    <button @click="deletePromotion(item.id)" class="btn btn-sm btn-ghost text-red-600 hover:bg-red-50">
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
import PromotionService from '../services/promotion.service';
import { push } from 'notivue';

const promotionService = new PromotionService();
const promotions = ref([]);
const router = useRouter();

const fetchPromotions = async () => {
  try {
    promotions.value = await promotionService.getAllPromotions();
  } catch (error) {
    console.error(error);
    push.error('Không thể tải danh sách khuyến mãi');
  }
};

const deletePromotion = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
    try {
      await promotionService.deletePromotion(id);
      push.success('Xóa khuyến mãi thành công!');
      fetchPromotions();
    } catch (error) {
      console.error(error);
      push.error('Có lỗi xảy ra khi xóa khuyến mãi');
    }
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

onMounted(() => {
  const role = localStorage.getItem("role");
  if (role !== "staff") {
    router.push("/");
    return;
  }
  fetchPromotions();
});
</script>
