<script setup>
import { useRouter } from 'vue-router';
import UserService from '../services/user.service';
import { push } from 'notivue';
import { useForm, useField } from "vee-validate";
import { loginSchema } from '../validations/login.validation';

const userService = new UserService();
const router = useRouter();
const { handleSubmit } = useForm({ validationSchema: loginSchema });

const { value: username, errorMessage: usernameError } = useField("username");
const { value: password, errorMessage: passwordError } = useField("password");

const handleUserLogin = handleSubmit(async () => {
  try {
    const response = await userService.login(username.value, password.value);
    if (response?.data?.token) {
      localStorage.setItem("authenticateToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("username", response.data.user.username);
      localStorage.setItem("id", response.data.user.id);
      localStorage.setItem("role", "user");
      localStorage.setItem("avatar", response.data.user.avatar || "");
      push.success("Đăng nhập thành công");
      router.push("/");
    }
  } catch (error) {
    console.error(error);
    if (error.response?.status === 400) push.error("Vui lòng điền đầy đủ thông tin");
    else if (error.response?.status === 401) push.error("Mật khẩu không khớp");
    else if (error.response?.status === 404) push.error("Tên đăng nhập không tồn tại");
    else push.error("Đăng nhập thất bại, vui lòng thử lại");
  }
});

const loginWithGoogle = () => { window.location.href = "http://localhost:3000/api/auth/google"; };
const loginWithFacebook = () => { window.location.href = "http://localhost:3000/api/auth/facebook"; };
</script>

<template>
  <div class="sp-page">
    <!-- Left decorative panel -->
    <div class="sp-panel" aria-hidden="true">
      <div class="sp-panel__bg"></div>
      <div class="sp-panel__content">
        <div class="sp-panel__badge">Skincare AI</div>
        <p class="sp-panel__tagline">Chăm sóc da<br/>đúng cách — mỗi ngày.</p>
        <p class="sp-panel__sub">Phân tích da thông minh, sản phẩm phù hợp nhất.</p>
      </div>
    </div>

    <!-- Right form area -->
    <div class="sp-form-area">
      <div class="sp-card">
        <!-- Logo -->
        <div class="sp-logo">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="sp-logo__icon">
            <circle cx="20" cy="20" r="20" fill="#e11d48"/>
            <path d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="20" cy="22" r="3" fill="white"/>
            <path d="M14 28c1.5-1.5 3.4-2 6-2s4.5.5 6 2" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="sp-logo__text">Testskin</span>
        </div>

        <h1 class="sp-title">Đăng nhập vào Testskin</h1>

        <!-- Social buttons -->
        <div class="sp-socials">
          <button @click="loginWithGoogle" class="sp-social-btn" type="button">
            <svg viewBox="0 0 48 48" class="sp-social-btn__icon"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/></svg>
            <span>Tiếp tục với Google</span>
          </button>

          <button @click="loginWithFacebook" class="sp-social-btn" type="button">
            <svg viewBox="0 0 24 24" class="sp-social-btn__icon" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span>Tiếp tục với Facebook</span>
          </button>
        </div>

        <!-- Divider -->
        <div class="sp-divider"><span>hoặc</span></div>

        <!-- Form -->
        <form @submit.prevent="handleUserLogin" class="sp-form">
          <div class="sp-field">
            <label class="sp-field__label" for="username">Tên đăng nhập</label>
            <input
              v-model="username"
              id="username"
              type="text"
              class="sp-field__input"
              :class="{ 'sp-field__input--error': usernameError }"
              placeholder="Tên đăng nhập của bạn"
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
              placeholder="Mật khẩu của bạn"
            />
            <span v-if="passwordError" class="sp-field__error">{{ passwordError }}</span>
          </div>

          <button type="submit" class="sp-submit-btn">Đăng nhập</button>
        </form>

        <!-- Footer links -->
        <div class="sp-footer">
          <p>Chưa có tài khoản? <RouterLink to="/user/register" class="sp-link">Đăng ký Testskin</RouterLink></p>
          <p style="margin-top:0.5rem">Bạn là nhân viên? <RouterLink to="/staff/login" class="sp-link">Cổng nhân viên</RouterLink></p>
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
  background: #f0fdf4; /* Mint white background */
  font-family: 'Inter', -apple-system, sans-serif;
}

/* ─── Left decorative panel ─── */
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
  background: linear-gradient(160deg, #0f766e 0%, #115e59 45%, #134e4a 100%);
}

.sp-panel__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(2,44,34,0.4) 0%, transparent 50%);
}

.sp-panel__content {
  position: relative;
  z-index: 1;
}

.sp-panel__tagline {
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  color: white;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

/* ─── Right form area ─── */
.sp-form-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: #f9fbfb;
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
  margin-bottom: 2.5rem;
}

.sp-logo__icon {
  width: 44px;
  height: 44px;
}

.sp-logo__text {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f766e;
  letter-spacing: -0.03em;
}

/* ─── Title ─── */
.sp-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin-bottom: 2rem;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

/* ─── Social buttons ─── */
.sp-socials {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.sp-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1.25rem;
  border-radius: 50px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s, transform 0.1s;
  font-family: inherit;
}

.sp-social-btn:hover {
  border-color: #0d9488;
  background: #f8fafc;
  transform: scale(1.01);
}

.sp-social-btn__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* ─── Divider ─── */
.sp-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
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
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ─── Form fields ─── */
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
  box-shadow: 0 0 0 3px rgba(13,148,136,0.2);
}

.sp-field__input--error {
  border-color: #ef4444 !important;
}

.sp-field__input--error:focus {
  box-shadow: 0 0 0 3px rgba(239,68,68,0.2) !important;
}

.sp-field__error {
  font-size: 0.78rem;
  color: #fb7185;
  font-weight: 500;
}

/* ─── Submit button ─── */
.sp-submit-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 0.5rem;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #0d9488, #0f766e);
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
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(13,148,136,0.5);
}

.sp-submit-btn:active {
  transform: scale(0.99);
}

/* ─── Footer ─── */
.sp-footer {
  margin-top: 2rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.6;
}

.sp-link {
  color: #0d9488;
  font-weight: 700;
  text-decoration: underline;
  transition: color 0.15s;
}

.sp-link:hover {
  color: #0f766e;
}
</style>
