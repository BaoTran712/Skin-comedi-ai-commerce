<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import { useRouter, useRoute } from 'vue-router';
import { computed, onMounted } from "vue";
import { push } from 'notivue';
import { useForm, useField } from "vee-validate";
import { staffSchema } from '../validations/staff.validation';
import StaffService from '../services/staff.service';

const route = useRoute();
const router = useRouter();
const staffService = new StaffService();
const staffEditId = route.params.id;
const staffId = computed(() => localStorage.getItem("id"));
const role = computed(() => localStorage.getItem("role"));

const { handleSubmit, resetForm } = useForm({
  validationSchema: staffSchema
});

const { value: name, errorMessage: nameError } = useField("name");
const { value: username, errorMessage: usernameError } = useField("username");
const { value: password, errorMessage: passwordError } = useField("password");
const { value: address, errorMessage: addressError } = useField("address");
const { value: phone, errorMessage: phoneError } = useField("phone");
const { value: avatar, errorMessage: avatarError } = useField("avatar");

const handleStaffProfileEdit = handleSubmit(async (values) => {
  try {
    await staffService.updateStaff(staffEditId, values);
    push.success("Cập nhật thông tin nhân viên thành công");
    router.push("/staffs");
  } catch (error) {
    if (error.response?.status === 409) {
      push.error("Tên đăng nhập đã tồn tại");
    } else {
      push.error("Đã xảy ra lỗi khi cập nhật thông tin nhân viên");
    }
    console.log(error);
  }
});

const handleStaffProfileDelete = async (id) => {
  try {
    if (confirm("Xác nhận xóa nhân viên này?")) {
      await staffService.deleteStaff(id);
      push.success("Xóa nhân viên thành công");
      router.push("/staffs");
    }
  } catch (error) {
    push.error("Đã xảy ra lỗi khi xóa nhân viên");
  }
};

onMounted(async () => {
  if (role.value !== "staff") {
    router.push("/");
    return;
  }
  const targetId = (staffEditId !== staffId.value) ? staffEditId : staffId.value;
  try {
    const staffData = await staffService.getStaff(targetId);
    resetForm({
      values: {
        name: staffData.name,
        username: staffData.username,
        phone: staffData.phone,
        address: staffData.address,
        avatar: staffData.avatar,
      }
    });
  } catch (error) {
    push.error("Không thể tải thông tin nhân viên");
  }
});
</script>

<template>
  <div class="pe-page">
    <Header />

    <main class="pe-main">
      <div class="pe-container">
        <!-- Header bar -->
        <div class="pe-header">
          <RouterLink :to="staffEditId === staffId ? '/staffprofile' : '/staffs'" class="pe-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
            </svg>
          </RouterLink>
          <h1 class="pe-title">Cập nhật nhân viên</h1>
        </div>

        <form @submit.prevent="handleStaffProfileEdit">
          <!-- Avatar section -->
          <div class="pe-avatar-section">
            <div class="pe-avatar-wrap">
              <img :src="avatar || 'https://i.pravatar.cc/150?u=preview'" class="pe-avatar-img" alt="Avatar" />
              <div class="pe-avatar-badge">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div class="pe-avatar-input-wrap">
              <label class="pe-label">Link ảnh đại diện</label>
              <input v-model="avatar" type="text" class="pe-input" placeholder="https://..." />
              <span class="pe-hint">Dùng link từ i.pravatar.cc hoặc unsplash</span>
              <span class="pe-error">{{ avatarError }}</span>
            </div>
          </div>

          <!-- Fields grid -->
          <div class="pe-grid">
            <div class="pe-field pe-field--full">
              <label class="pe-label">Họ và tên</label>
              <input v-model="name" type="text" class="pe-input" placeholder="Nguyễn Văn An" />
              <span class="pe-error">{{ nameError }}</span>
            </div>

            <div class="pe-field pe-field--full">
              <label class="pe-label">Địa chỉ</label>
              <input v-model="address" type="text" class="pe-input" placeholder="Cần Thơ, Việt Nam" />
              <span class="pe-error">{{ addressError }}</span>
            </div>

            <div class="pe-field">
              <label class="pe-label">Số điện thoại</label>
              <input v-model="phone" type="text" class="pe-input" placeholder="0909 000 111" />
              <span class="pe-error">{{ phoneError }}</span>
            </div>

            <div class="pe-field">
              <label class="pe-label">Tên đăng nhập</label>
              <input v-model="username" type="text" class="pe-input" placeholder="username" />
              <span class="pe-error">{{ usernameError }}</span>
            </div>

            <div class="pe-field pe-field--full">
              <label class="pe-label">Mật khẩu mới <span class="pe-optional">(để trống nếu không đổi)</span></label>
              <input v-model="password" type="password" class="pe-input" placeholder="••••••••" />
              <span class="pe-error">{{ passwordError }}</span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="pe-actions">
            <template v-if="staffEditId !== staffId">
              <button type="submit" class="pe-btn pe-btn--primary">Lưu thay đổi</button>
              <button type="button" @click="handleStaffProfileDelete(staffEditId)" class="pe-btn pe-btn--danger">Xóa nhân viên</button>
            </template>
            <template v-else>
              <button type="submit" class="pe-btn pe-btn--primary">Lưu thay đổi</button>
            </template>
          </div>
        </form>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.pe-page {
  min-height: 100vh;
  background: #f1f5f9; /* Slate-100 background */
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.pe-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2.5rem 1rem 4rem;
}

.pe-container {
  width: 100%;
  max-width: 640px;
}

/* ─── Header bar ─── */
.pe-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.pe-back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  transition: all 0.15s;
  flex-shrink: 0;
}

.pe-back-btn:hover {
  background: #f8fafc;
  border-color: #0d9488;
  color: #0d9488;
}

.pe-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 0;
}

/* ─── Avatar section ─── */
.pe-avatar-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.pe-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.pe-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #0d9488;
}

.pe-avatar-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 26px;
  height: 26px;
  background: #0d9488;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
}

.pe-avatar-input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.pe-hint {
  font-size: 0.75rem;
  color: #525252;
  font-style: italic;
}

/* ─── Fields grid ─── */
.pe-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.pe-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pe-field--full {
  grid-column: 1 / -1;
}

.pe-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.04em;
}

.pe-optional {
  font-weight: 400;
  color: #64748b;
  font-size: 0.75rem;
}

.pe-input {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.pe-input:focus {
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13,148,136,0.2);
}

.pe-input::placeholder {
  color: #94a3b8;
}

.pe-error {
  font-size: 0.75rem;
  color: #f87171;
  min-height: 1rem;
}

/* ─── Actions ─── */
.pe-actions {
  display: flex;
  gap: 0.75rem;
}

.pe-btn {
  flex: 1;
  padding: 0.9rem;
  border-radius: 50px;
  border: none;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  letter-spacing: 0.02em;
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

.pe-btn--danger {
  background: transparent;
  color: #ef4444;
  border: 1px solid #fee2e2;
}

.pe-btn--danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

@media (max-width: 480px) {
  .pe-grid {
    grid-template-columns: 1fr;
  }
  .pe-field--full {
    grid-column: 1;
  }
  .pe-avatar-section {
    flex-direction: column;
    text-align: center;
  }
}
</style>