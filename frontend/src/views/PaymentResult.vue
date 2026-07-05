<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const success = ref(false);
const orderId = ref('');
const error = ref('');

onMounted(() => {
  // Mock check delay for UX
  setTimeout(() => {
    success.value = route.query.success === 'true';
    orderId.value = route.query.order_id || '';
    error.value = route.query.error || '';
    loading.value = false;
  }, 1000);
});
</script>

<template>
  <div class="pe-page">
    <Header />

    <main class="pe-main">
      <div class="pe-container max-w-md">
        <div class="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
          
          <div v-if="loading" class="py-12 flex flex-col items-center">
            <span class="loading loading-spinner loading-lg text-teal-600"></span>
            <h2 class="mt-4 text-xl font-bold text-gray-800">Đang xác thực giao dịch...</h2>
            <p class="text-sm text-gray-500 mt-2">Vui lòng chờ trong giây lát.</p>
          </div>

          <div v-else-if="success" class="space-y-6">
            <div class="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto text-4xl border border-teal-100 shadow-sm">
              ✓
            </div>
            <h2 class="text-2xl font-black text-gray-900 leading-tight">Thanh toán thành công!</h2>
            <p class="text-gray-500 text-sm leading-relaxed">
              Cảm ơn bạn đã mua sắm tại Testskin. Đơn hàng của bạn đã được thanh toán trực tuyến thành công và đang được chuẩn bị đóng gói.
            </p>
            <div class="bg-teal-50/30 border border-teal-100/50 rounded-xl p-4 text-left text-sm space-y-1">
              <p class="text-gray-700"><span class="font-bold text-gray-800">Mã giao dịch:</span> {{ orderId }}</p>
              <p class="text-gray-700"><span class="font-bold text-gray-800">Trạng thái:</span> Đã thanh toán</p>
            </div>
            <button @click="router.push('/userprofile')" class="pe-btn pe-btn--primary w-full mt-4">
              Xem đơn hàng của tôi
            </button>
            <button @click="router.push('/')" class="btn btn-outline btn-sm rounded-full w-full mt-2 border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900">
              Về trang chủ
            </button>
          </div>

          <div v-else class="space-y-6">
            <div class="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-4xl border border-rose-100 shadow-sm">
              ✕
            </div>
            <h2 class="text-2xl font-black text-gray-900 leading-tight">Thanh toán thất bại</h2>
            <p class="text-gray-500 text-sm leading-relaxed">
              Giao dịch thanh toán trực tuyến không thành công hoặc đã bị hủy bỏ từ phía người dùng.
            </p>
            <div class="bg-rose-50/30 border border-rose-100/50 rounded-xl p-4 text-left text-sm text-rose-700">
              <p v-if="error === 'invalid_signature'">Lỗi: Chữ ký xác thực của cổng thanh toán không hợp lệ.</p>
              <p v-else-if="error === 'update_failed'">Lỗi: Đã có lỗi xảy ra khi cập nhật đơn hàng.</p>
              <p v-else>Lý do: Giao dịch bị hủy hoặc tài khoản thẻ không đủ số dư.</p>
            </div>
            <button @click="router.push('/cart')" class="pe-btn pe-btn--primary w-full mt-4">
              Quay lại giỏ hàng
            </button>
          </div>

        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.pe-page {
  min-height: 100vh;
  background: #f0fdf4; /* Mint white background */
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.pe-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 4rem 1rem;
}

.pe-container {
  width: 100%;
}

.pe-btn {
  padding: 0.85rem;
  border-radius: 50px;
  border: none;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  letter-spacing: 0.02em;
  display: block;
}

.pe-btn--primary {
  background: linear-gradient(135deg, #0d9488, #0f766e);
  color: white;
  box-shadow: 0 4px 16px rgba(13,148,136,0.35);
}

.pe-btn--primary:hover {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(13,148,136,0.5);
}
</style>
