<script setup>
import { useRouter } from 'vue-router';
import StaffService from '../services/staff.service';
import { push } from 'notivue';
import { useForm, useField } from "vee-validate";
import { loginSchema } from '../validations/login.validation';

const staffService = new StaffService();
const router = useRouter();
const { handleSubmit } = useForm({ validationSchema: loginSchema });

const { value: username, errorMessage: usernameError } = useField("username");
const { value: password, errorMessage: passwordError } = useField("password");

const handleStaffLogin = handleSubmit(async () => {
  try {
    const response = await staffService.login(username.value, password.value);
    if (response?.data?.token) {
      localStorage.setItem("authenticateToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.staff));
      localStorage.setItem("username", response.data.staff.username);
      localStorage.setItem("id", response.data.staff.id);
      localStorage.setItem("role", "staff");
      localStorage.setItem("avatar", response.data.staff.avatar || "");
      push.success("Đăng nhập thành công");
      router.push("/products");
    }
  } catch (error) {
    console.error(error);
    if (error.response?.status === 400) push.error("Vui lòng điền đầy đủ thông tin");
    else if (error.response?.status === 404) push.error("Tên đăng nhập không tồn tại");
    else if (error.response?.status === 401) push.error("Mật khẩu không khớp");
    else push.error("Đăng nhập thất bại, vui lòng thử lại");
  }
});
</script>

<template>
  <div class="sp-page">
    <!-- Left decorative panel — staff dark theme -->
    <div class="sp-panel" aria-hidden="true">
      <div class="sp-panel__bg"></div>
      <div class="sp-panel__content">
        <div class="sp-panel__badge">Admin Portal</div>
        <p class="sp-panel__tagline">Quản trị hệ thống<br/>Testskin.</p>
        <p class="sp-panel__sub">Dành riêng cho nhân viên có thẩm quyền.</p>
      </div>
    </div>

    <!-- Right form area -->
    <div class="sp-form-area">
      <div class="sp-card">
        <!-- Logo -->
        <div class="sp-logo">
          <svg viewBox="0 0 40 40" fill="none" class="sp-logo__icon">
            <circle cx="20" cy="20" r="20" fill="white" fill-opacity="0.1"/>
            <path d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="20" cy="22" r="3" fill="white"/>
            <path d="M14 28c1.5-1.5 3.4-2 6-2s4.5.5 6 2" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="sp-logo__text">Testskin</span>
        </div>

        <h1 class="sp-title">Cổng Nhân Viên</h1>
        <p class="sp-subtitle">Chỉ dành cho nhân viên & quản trị viên</p>

        <!-- Divider -->
        <div class="sp-divider"><span>đăng nhập</span></div>

        <!-- Form -->
        <form @submit.prevent="handleStaffLogin" class="sp-form">
          <div class="sp-field">
            <label class="sp-field__label" for="username">Tên đăng nhập</label>
            <input
              v-model="username"
              id="username"
              type="text"
              class="sp-field__input"
              :class="{ 'sp-field__input--error': usernameError }"
              placeholder="Tên đăng nhập"
              autocomplete="username"
            />
            <span v-if="usernameError" class="sp-field__error">{{ usernameError }}</span>
          </div>

          <div class="sp-field">
            <label class="sp-field__label" for="password">Mật khẩu</label>
            <input
              v-model="password"
              id="password"
              type="password"
              class="sp-field__input"
              :class="{ 'sp-field__input--error': passwordError }"
              placeholder="Mật khẩu"
              autocomplete="current-password"
            />
            <span v-if="passwordError" class="sp-field__error">{{ passwordError }}</span>
          </div>

          <button type="submit" class="sp-submit-btn">Đăng nhập</button>
        </form>

        <!-- Footer links -->
        <div class="sp-footer">
          <p>Bạn là người dùng? <RouterLink to="/user/login" class="sp-link">Đăng nhập tại đây</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* { box-sizing: border-box; }

.sp-page {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* ─── Left panel ─── */
.sp-panel {
  display: none;
  position: relative;
  overflow: hidden;
}

@media (min-width: 900px) {
  .sp-panel {
    display: flex;
    flex: 1;
    align-items: flex-end;
    padding: 4rem;
  }
}

.sp-panel__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #334155 100%);
}

.sp-panel__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 25% 35%, rgba(45,212,191,0.15) 0%, transparent 55%),
    radial-gradient(circle at 75% 75%, rgba(15,23,42,0.4) 0%, transparent 50%);
}

.sp-panel__content {
  position: relative;
  z-index: 1;
}

.sp-panel__badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  background: rgba(45,212,191,0.15);
  border: 1px solid rgba(45,212,191,0.35);
  color: #5eead4;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 1.25rem;
}

.sp-panel__tagline {
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  color: white;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

.sp-panel__sub {
  color: rgba(255,255,255,0.45);
  font-size: 0.9rem;
}

/* ─── Form area ─── */
.sp-form-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: #f8fafc;
}

.sp-card {
  width: 100%;
  max-width: 400px;
}

/* ─── Logo ─── */
.sp-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 2rem;
}

.sp-logo__icon {
  width: 44px;
  height: 44px;
}

.sp-logo__text {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
}

/* ─── Title ─── */
.sp-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  letter-spacing: -0.03em;
  margin: 0;
}

.sp-subtitle {
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.4rem;
  margin-bottom: 2rem;
}

/* ─── Divider ─── */
.sp-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.sp-divider::before,
.sp-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.sp-divider span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

/* ─── Form ─── */
.sp-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sp-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sp-field__label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.04em;
}

.sp-field__input {
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #0f172a;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.sp-field__input:focus {
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13,148,136,0.25);
}

.sp-field__input--error { border-color: #ef4444 !important; }
.sp-field__input--error:focus { box-shadow: 0 0 0 2px rgba(239,68,68,0.2) !important; }

.sp-field__error {
  font-size: 0.78rem;
  color: #ef4444;
  font-weight: 500;
}

/* ─── Submit ─── */
.sp-submit-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 0.5rem;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  color: white;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 20px rgba(13,148,136,0.35);
}

.sp-submit-btn:hover {
  background: linear-gradient(135deg, #2dd4bf, #14b8a6);
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(13,148,136,0.5);
}

.sp-submit-btn:active { transform: scale(0.99); }

/* ─── Footer ─── */
.sp-footer {
  margin-top: 2rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
}

.sp-link {
  color: #0d9488;
  font-weight: 700;
  text-decoration: underline;
  transition: color 0.15s;
}

.sp-link:hover { color: #0f766e; }
</style>
