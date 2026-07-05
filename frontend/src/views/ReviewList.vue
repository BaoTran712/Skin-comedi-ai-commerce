<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Kiểm Duyệt Bình Luận</h1>
        <p class="text-gray-500 mt-1">Quản lý nhận xét, đánh giá của người dùng về sản phẩm</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-gray-50">
              <tr>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th class="text-center">Đánh giá</th>
                <th>Nội dung</th>
                <th>Trạng thái</th>
                <th class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="reviews.length === 0">
                <td colspan="6" class="text-center py-8 text-gray-500">Chưa có bình luận nào.</td>
              </tr>
              <tr v-for="item in reviews" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="font-medium text-gray-800">{{ item.user_id?.username || 'Khách vãng lai' }}</td>
                <td class="text-sm text-gray-600 max-w-xs truncate" :title="item.product_id?.title">
                  {{ item.product_id?.title || 'Sản phẩm không rõ' }}
                </td>
                <td class="text-center">
                  <span class="text-amber-400 font-bold">★ {{ item.rating }}</span>
                </td>
                <td class="max-w-xs whitespace-pre-line" :title="item.comment">{{ item.comment }}</td>
                <td>
                  <span class="badge" :class="item.status === 'approved' ? 'badge-success' : 'badge-warning'">
                    {{ item.status === 'approved' ? 'Hiển thị' : 'Đang ẩn' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button v-if="item.status !== 'approved'" @click="toggleStatus(item, 'approved')" class="btn btn-sm btn-ghost text-green-600 hover:bg-green-50">
                      Duyệt
                    </button>
                    <button v-else @click="toggleStatus(item, 'hidden')" class="btn btn-sm btn-ghost text-amber-600 hover:bg-amber-50">
                      Ẩn
                    </button>
                    <button @click="deleteReview(item.id)" class="btn btn-sm btn-ghost text-red-600 hover:bg-red-50">
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
import ReviewService from '../services/review.service';
import { push } from 'notivue';

const reviewService = new ReviewService();
const reviews = ref([]);
const router = useRouter();

const fetchReviews = async () => {
  try {
    reviews.value = await reviewService.getAllReviews();
  } catch (error) {
    console.error(error);
    push.error('Không thể tải danh sách bình luận');
  }
};

const toggleStatus = async (item, newStatus) => {
  try {
    await reviewService.updateReview(item.id, { ...item, status: newStatus });
    push.success(newStatus === 'approved' ? 'Đã hiển thị bình luận!' : 'Đã ẩn bình luận!');
    fetchReviews();
  } catch (error) {
    console.error(error);
    push.error('Không thể cập nhật trạng thái bình luận');
  }
};

const deleteReview = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
    try {
      await reviewService.deleteReview(id);
      push.success('Xóa bình luận thành công!');
      fetchReviews();
    } catch (error) {
      console.error(error);
      push.error('Có lỗi xảy ra khi xóa bình luận');
    }
  }
};

onMounted(() => {
  const role = localStorage.getItem("role");
  if (role !== "staff") {
    router.push("/");
    return;
  }
  fetchReviews();
});
</script>
