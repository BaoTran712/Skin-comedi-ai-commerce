<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

import { useAuth } from '../composables/useAuth';
import { ref, computed, onMounted } from "vue";
import UserService from '../services/user.service';
import OrderService from '../services/order.service';
import ReviewService from '../services/review.service';
import { useRouter } from 'vue-router';

const router = useRouter();
const { logOut } = useAuth();
const userService = new UserService();
const borrowService = new OrderService();
const reviewService = new ReviewService();

const user = ref({});
const borrowings = ref([]);
const userReviews = ref([]);
const user_id = computed(() => localStorage.getItem("id"));
const loading = ref(true);
const activeTab = ref('info');

const goToUserProfileEdit = async (id) => {
  router.push({ name: "userprofile.edit", params: { id } });
};

const fetchData = async () => {
  loading.value = true;
  try {
    const user_data = await userService.getUser(user_id.value);
    user.value = user_data;
    
    // Fetch Borrowings
    borrowings.value = await borrowService.getAllOrders({ user_id: user_id.value });
    
    // Fetch Reviews
    userReviews.value = await reviewService.getReviewsByUserId(user_id.value);
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};

const handleRenew = async (borrowId) => {
  try {
    await borrowService.updateOrder(borrowId, { action: "renew" });
    await fetchData();
  } catch (error) {
    if (error.response?.data?.message) {
      alert("Lỗi: " + error.response.data.message);
    } else {
      alert("Không thể gia hạn sản phẩm này");
    }
  }
};

const isBookOverdue = (returnDateStr, status) => {
  return new Date() > new Date(returnDateStr) && status === 'borrowing';
};

const isUserSuspended = computed(() => {
  if (!user.value || !user.value.suspended_until) return false;
  return new Date(user.value.suspended_until) > new Date();
});

onMounted(fetchData);
</script>

<template>
  <div class="up-page">
    <Header />

    <main class="up-main">
      <div v-if="loading" class="flex justify-center items-center py-32">
        <span class="loading loading-spinner text-teal-500 loading-lg"></span>
      </div>

      <div v-else class="up-container">
        <!-- Suspension Alert -->
        <div v-if="isUserSuspended" class="up-alert">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="font-bold text-base text-red-200">Tài khoản của bạn đang tạm ngưng cấm đơn hàng!</h3>
            <p class="text-sm text-red-300 mt-1">Lý do: Vi phạm trả sản phẩm trễ hạn. Hạn cấm đến: {{ new Date(user.suspended_until).toLocaleString('vi-VN') }}</p>
          </div>
        </div>

        <!-- Profile Card -->
        <div class="up-card">
          <!-- Profile Header Section -->
          <div class="up-header">
            <div class="up-avatar-wrap">
              <div class="up-avatar">
                <img v-if="user.avatar" :src="user.avatar" alt="Avatar" class="up-avatar-img" />
                <span v-else class="up-avatar-placeholder">{{ user.first_name?.charAt(0) || 'U' }}</span>
              </div>
            </div>

            <div class="up-info">
              <h1 class="up-name">{{ user.last_name }} {{ user.first_name }}</h1>
              <div class="up-tags">
                <span class="up-tag up-tag--username">@{{ user.username }}</span>
                <span class="up-tag up-tag--points">💎 {{ user.points || 0 }} Điểm thân thiết</span>
              </div>
            </div>

            <div class="up-actions">
              <button @click="goToUserProfileEdit(user_id)" class="up-btn up-btn--primary">
                Sửa hồ sơ
              </button>
              <button @click="logOut" class="up-btn up-btn--secondary">
                Đăng xuất
              </button>
            </div>
          </div>

          <!-- Profile Nav Tabs -->
          <div class="up-tabs">
            <button @click="activeTab = 'info'" class="up-tab" :class="{'up-tab--active': activeTab === 'info'}">Thông tin</button>
            <button @click="activeTab = 'history'" class="up-tab" :class="{'up-tab--active': activeTab === 'history'}">Lịch sử mượn</button>
            <button @click="activeTab = 'reviews'" class="up-tab" :class="{'up-tab--active': activeTab === 'reviews'}">Đánh giá</button>
          </div>

          <!-- Profile Details Section -->
          <div class="up-content">
            <!-- Tab: Personal Info -->
            <div v-if="activeTab === 'info'" class="up-tab-content">
              <div class="up-info-grid">
                <div class="up-info-item">
                  <p class="up-info-label">Họ và tên</p>
                  <p class="up-info-value">{{ user.last_name }} {{ user.first_name }}</p>
                </div>
                <div class="up-info-item">
                  <p class="up-info-label">Thông tin cá nhân</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="up-badge" :class="user.gender ? 'up-badge--male' : 'up-badge--female'">
                      {{ user.gender ? 'Nam' : 'Nữ' }}
                    </span>
                    <span class="up-info-value font-normal">{{ user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : "---" }}</span>
                  </div>
                </div>
                <div class="up-info-item">
                  <p class="up-info-label">Liên hệ</p>
                  <p class="up-info-value">{{ user.phone || "---" }}</p>
                </div>
                <div class="up-info-item">
                  <p class="up-info-label">Địa chỉ hiện tại</p>
                  <p class="up-info-value">{{ user.address || "---" }}</p>
                </div>
              </div>
            </div>

            <!-- Tab: Borrowing History -->
            <div v-if="activeTab === 'history'" class="up-tab-content">
              <div v-if="borrowings.length === 0" class="up-empty">
                <p>Chưa có lịch sử đơn hàng</p>
              </div>
              <div v-else class="up-table-wrap">
                <table class="up-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Ngày mượn</th>
                      <th>Hạn trả</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="borrow in borrowings" :key="borrow._id">
                      <td class="font-bold text-white">{{ borrow.product_id?.title || 'Sản phẩm đã bị xóa' }}</td>
                      <td>{{ new Date(borrow.borrow_date).toLocaleDateString('vi-VN') }}</td>
                      <td>
                        <span :class="{'text-red-500 font-bold': new Date() > new Date(borrow.return_date) && borrow.status !== 'returned'}">
                          {{ new Date(borrow.return_date).toLocaleDateString('vi-VN') }}
                        </span>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <span v-if="borrow.status === 'pending'" class="up-status-badge up-status-badge--warning">Chờ duyệt</span>
                          <span v-else-if="borrow.status === 'borrowing' && isBookOverdue(borrow.return_date, borrow.status)" class="up-status-badge up-status-badge--danger">Quá hạn</span>
                          <span v-else-if="borrow.status === 'borrowing'" class="up-status-badge up-status-badge--info">Đang mượn</span>
                          <span v-else-if="borrow.status === 'returned'" class="up-status-badge up-status-badge--success">Đã trả</span>
                          <span v-else-if="borrow.status === 'rejected'" class="up-status-badge up-status-badge--danger">Từ chối</span>
                          <span v-else-if="borrow.status === 'overdue'" class="up-status-badge up-status-badge--danger">Quá hạn</span>
                          <span v-else-if="borrow.status === 'return_pending'" class="up-status-badge up-status-badge--warning">Chờ trả</span>

                          <!-- Renew Button -->
                          <button v-if="borrow.status === 'borrowing' && !isBookOverdue(borrow.return_date, borrow.status)" 
                                  @click="handleRenew(borrow._id)" 
                                  class="up-renew-btn">
                            Gia hạn +7
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Tab: User Reviews -->
            <div v-if="activeTab === 'reviews'" class="up-tab-content">
              <div v-if="userReviews.length === 0" class="up-empty">
                <p>Bạn chưa có đánh giá nào</p>
              </div>
              <div v-else class="up-reviews-grid">
                <div v-for="review in userReviews" :key="review._id" class="up-review-card">
                  <div class="up-review-header">
                    <div>
                      <span class="up-review-prod">Sản phẩm: {{ review.product_id?.title || 'Sản phẩm đã xóa' }}</span>
                      <div class="up-stars">
                        <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" 
                            :class="i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700 fill-zinc-800'" 
                            class="h-3 w-3" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </div>
                    </div>
                    <span class="text-xs text-zinc-500">{{ new Date(review.createdAt).toLocaleDateString('vi-VN') }}</span>
                  </div>
                  <p class="up-review-comment">"{{ review.comment }}"</p>
                  
                  <div v-if="review.reply" class="up-review-reply">
                    <span class="up-reply-label">Phản hồi của hệ thống</span>
                    <p class="up-reply-text">{{ review.reply }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.up-page {
  min-height: 100vh;
  background: #f0fdf4; /* Mint white background */
  color: #334155;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.up-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2.5rem 1rem 4rem;
}

.up-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Alert ─── */
.up-alert {
  background: rgba(220, 38, 38, 0.15);
  border: 1px solid rgba(220, 38, 38, 0.35);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  color: #f87171;
}

/* ─── Profile Card ─── */
.up-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(13,148,136,0.06);
}

/* ─── Profile Header ─── */
.up-header {
  padding: 2.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.up-avatar-wrap {
  flex-shrink: 0;
}

.up-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #1a1a1a;
  border: 2px solid #0d9488;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.up-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.up-avatar-placeholder {
  font-size: 3rem;
  font-weight: 800;
  color: #3f3f46;
  text-transform: uppercase;
}

.up-info {
  flex: 1;
  min-width: 200px;
}

.up-name {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 0;
}

.up-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.up-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
}

.up-tag--username {
  background: rgba(15,23,42,0.05);
  color: #475569;
  border: 1px solid rgba(15,23,42,0.1);
}

.up-tag--points {
  background: rgba(13,148,136,0.15);
  color: #2dd4bf;
  border: 1px solid rgba(13,148,136,0.3);
}

.up-actions {
  display: flex;
  gap: 0.75rem;
}

.up-btn {
  padding: 0.65rem 1.25rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.up-btn--primary {
  background: linear-gradient(135deg, #0d9488, #0f766e);
  color: white;
  box-shadow: 0 4px 12px rgba(13,148,136,0.25);
}

.up-btn--primary:hover {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  transform: scale(1.02);
}

.up-btn--secondary {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.up-btn--secondary:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* ─── Profile Tabs ─── */
.up-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 1rem;
}

.up-tab {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 1rem 1.5rem;
  cursor: pointer;
  position: relative;
  transition: color 0.15s;
}

.up-tab:hover {
  color: #0f172a;
}

.up-tab--active {
  color: #2dd4bf;
}

.up-tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 1.5rem;
  right: 1.5rem;
  height: 2px;
  background: #2dd4bf;
  border-radius: 2px;
}

/* ─── Content ─── */
.up-content {
  padding: 2.5rem 2rem;
}

/* Tab Content: Info */
.up-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
}

.up-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.up-info-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.up-info-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.up-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.6rem;
  border-radius: 4px;
}

.up-badge--male {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.up-badge--female {
  background: rgba(244, 114, 182, 0.15);
  color: #f472b6;
  border: 1px solid rgba(244, 114, 182, 0.3);
}

/* Tab Content: History */
.up-empty {
  text-align: center;
  padding: 4rem 1rem;
  color: #52525b;
  font-size: 1.1rem;
  font-weight: 600;
}

.up-table-wrap {
  overflow-x: auto;
}

.up-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.up-table th {
  padding: 1rem;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

.up-table td {
  padding: 1.25rem 1rem;
  color: #475569;
  font-size: 0.95rem;
  border-bottom: 1px solid #f1f5f9;
}

.up-status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

.up-status-badge--warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.up-status-badge--info {
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
}

.up-status-badge--success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.up-status-badge--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.up-renew-btn {
  background: transparent;
  border: 1px solid #27272a;
  color: #2dd4bf;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.up-renew-btn:hover {
  background: rgba(45,212,191,0.08);
  border-color: #0d9488;
}

/* Tab Content: Reviews */
.up-reviews-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.up-review-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
}

.up-review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.up-review-prod {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0d9488;
  margin-bottom: 0.25rem;
}

.up-stars {
  display: flex;
  gap: 0.1rem;
}

.up-review-comment {
  font-size: 0.9rem;
  color: #334155;
  font-style: italic;
  line-height: 1.5;
}

.up-review-reply {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(13,148,136,0.05);
  border-left: 3px solid #0d9488;
  border-radius: 4px;
}

.up-reply-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  color: #0f766e;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.up-reply-text {
  font-size: 0.85rem;
  color: #475569;
  margin: 0;
}

@media (max-width: 768px) {
  .up-header {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }
  .up-info-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .up-reviews-grid {
    grid-template-columns: 1fr;
  }
}
</style>