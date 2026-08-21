<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import { useAuth } from '../composables/useAuth';
import { ref, computed, onMounted } from "vue";
import StaffService from '../services/staff.service';
import { useRouter } from 'vue-router';

const { logOut } = useAuth();
const staffService = new StaffService();
const staff_id = computed(() => localStorage.getItem("id"));
const role = computed(() => localStorage.getItem("role"));
const staff = ref({});
const router = useRouter();

const goToStaffProfileEdit = (id) => {
  router.push({ name: "staffprofile.edit", params: { id } });
};

onMounted(async () => {
  if ((role.value || "").toLowerCase() !== "staff") {
    router.push("/");
    return;
  }
  try {
    staff.value = await staffService.getStaff(staff_id.value);
  } catch (error) {
    console.log(error);
  }
});
</script>

<template>
  <div class="sp-page">
    <Header />

    <main class="sp-main">
      <div class="sp-container">
        <!-- Profile Card -->
        <div class="sp-card">
          <!-- Profile Header Section -->
          <div class="sp-header">
            <div class="sp-avatar-wrap">
              <div class="sp-avatar">
                <img v-if="staff.avatar" :src="staff.avatar" alt="Avatar" class="sp-avatar-img" />
                <span v-else class="sp-avatar-placeholder">{{ staff.name?.charAt(0) || 'S' }}</span>
              </div>
            </div>

            <div class="sp-info">
              <h1 class="sp-name">{{ staff.name || "Nhân viên" }}</h1>
              <div class="sp-tags">
                <span class="sp-tag sp-tag--username">@{{ staff.username }}</span>
                <span class="sp-tag sp-tag--role">💼 Nhân viên hệ thống</span>
              </div>
            </div>

            <div class="sp-actions">
              <button @click="goToStaffProfileEdit(staff_id)" class="sp-btn sp-btn--primary">
                Chỉnh sửa
              </button>
              <button @click="logOut" class="sp-btn sp-btn--secondary">
                Đăng xuất
              </button>
            </div>
          </div>

          <!-- Profile Details Section -->
          <div class="sp-content">
            <h2 class="sp-section-title">Thông tin tài khoản</h2>
            <div class="sp-info-grid">
              <div class="sp-info-item">
                <p class="sp-info-label">Họ và tên nhân viên</p>
                <p class="sp-info-value">{{ staff.name || "Chưa xác định" }}</p>
              </div>
              <div class="sp-info-item">
                <p class="sp-info-label">Tên đăng nhập</p>
                <p class="sp-info-value">{{ staff.username || "Chưa xác định" }}</p>
              </div>
              <div class="sp-info-item">
                <p class="sp-info-label">Địa chỉ</p>
                <p class="sp-info-value">{{ staff.address || "Chưa xác định" }}</p>
              </div>
              <div class="sp-info-item">
                <p class="sp-info-label">Số điện thoại liên lạc</p>
                <p class="sp-info-value">{{ staff.phone || "Chưa xác định" }}</p>
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

.sp-page {
  min-height: 100vh;
  background: #f1f5f9; /* Slate-100 */
  color: #334155;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.sp-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2.5rem 1rem 4rem;
}

.sp-container {
  width: 100%;
  max-width: 760px;
}

/* ─── Profile Card ─── */
.sp-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15,23,42,0.05);
}

/* ─── Profile Header ─── */
.sp-header {
  padding: 2.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.sp-avatar-wrap {
  flex-shrink: 0;
}

.sp-avatar {
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

.sp-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sp-avatar-placeholder {
  font-size: 3rem;
  font-weight: 800;
  color: #3f3f46;
  text-transform: uppercase;
}

.sp-info {
  flex: 1;
  min-width: 200px;
}

.sp-name {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 0;
}

.sp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.sp-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
}

.sp-tag--username {
  background: rgba(15,23,42,0.05);
  color: #475569;
  border: 1px solid rgba(15,23,42,0.1);
}

.sp-tag--role {
  background: rgba(13,148,136,0.15);
  color: #2dd4bf;
  border: 1px solid rgba(13,148,136,0.3);
}

.sp-actions {
  display: flex;
  gap: 0.75rem;
}

.sp-btn {
  padding: 0.65rem 1.25rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.sp-btn--primary {
  background: linear-gradient(135deg, #0d9488, #0f766e);
  color: white;
  box-shadow: 0 4px 12px rgba(13,148,136,0.25);
}

.sp-btn--primary:hover {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  transform: scale(1.02);
}

.sp-btn--secondary {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.sp-btn--secondary:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* ─── Content ─── */
.sp-content {
  padding: 2.5rem 2rem;
}

.sp-section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-top: 0;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.sp-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
}

.sp-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sp-info-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sp-info-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 768px) {
  .sp-header {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }
  .sp-info-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>