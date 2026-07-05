<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import OrderService from "../services/order.service";

const username = computed(() => localStorage.getItem("username"));
const role = computed(() => localStorage.getItem("role"));

const borrowService = new OrderService();
const pendingCount = ref(0);
let countInterval = null;

const fetchPendingCounts = async () => {
  if (role.value === 'staff') {
    try {
      const allBorrows = await borrowService.getAllOrders();
      pendingCount.value = allBorrows.filter(
        b => b.status === "pending" || b.status === "return_pending"
      ).length;
    } catch (error) {
      console.log(error);
    }
  }
};

onMounted(() => {
  fetchPendingCounts();
  // refresh it every 15s to keep notifications alive
  countInterval = setInterval(fetchPendingCounts, 15000); 
});

onUnmounted(() => {
  if (countInterval) clearInterval(countInterval);
});

const cartCount = computed(() => {
  const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
  return savedCart.reduce((acc, item) => acc + item.quantity, 0);
});
</script>

<template>
  <!-- Glassmorphism Sticky Navbar -->
  <header class="ts-navbar">
    <div class="ts-navbar-inner">

      <!-- LEFT: Logo + Mobile Menu -->
      <div class="ts-navbar-start">
        <template v-if="role === 'user' || role === 'staff'">
          <div class="dropdown">
            <button tabindex="0" class="ts-menu-toggle lg:hidden" aria-label="Menu">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>
            <ul tabindex="0" class="ts-dropdown-menu">
              <template v-if="role === 'staff'">
                <li><RouterLink to="/products" class="ts-dropdown-link">Sản phẩm</RouterLink></li>
                <li>
                  <RouterLink to="/orderpending" class="ts-dropdown-link flex items-center gap-2">
                    Đơn đặt hàng
                    <span v-if="pendingCount > 0" class="ts-badge-pending animate-pulse">{{ pendingCount }}</span>
                  </RouterLink>
                </li>
                <li><RouterLink to="/brands" class="ts-dropdown-link">Thương hiệu</RouterLink></li>
                <li><RouterLink to="/ingredients" class="ts-dropdown-link">Thành phần</RouterLink></li>
                <li><RouterLink to="/banners" class="ts-dropdown-link">Quảng cáo</RouterLink></li>
                <li><RouterLink to="/promotions" class="ts-dropdown-link">Khuyến mãi</RouterLink></li>
                <li><RouterLink to="/contacts" class="ts-dropdown-link">Liên hệ</RouterLink></li>
                <li><RouterLink to="/reviews" class="ts-dropdown-link">Bình luận</RouterLink></li>
                <li><RouterLink to="/topics" class="ts-dropdown-link">Chủ đề</RouterLink></li>
                <li><RouterLink to="/settings" class="ts-dropdown-link">Cài đặt</RouterLink></li>
                <li><RouterLink to="/activity-log" class="ts-dropdown-link">Lịch sử HĐ</RouterLink></li>
                <li><RouterLink to="/users" class="ts-dropdown-link">Người dùng</RouterLink></li>
                <li><RouterLink to="/staffs" class="ts-dropdown-link">Nhân viên</RouterLink></li>
                <li><RouterLink to="/staffprofile" class="ts-dropdown-link">Thông tin nhân viên</RouterLink></li>
              </template>
              <template v-if="role === 'user'">
                <li><RouterLink to="/products" class="ts-dropdown-link">Sản phẩm</RouterLink></li>
                <li><RouterLink to="/diagnosis" class="ts-dropdown-link">Chuẩn đoán AI</RouterLink></li>
                <li><RouterLink to="/ordercheck" class="ts-dropdown-link">Kiểm tra đơn hàng</RouterLink></li>
                <li><RouterLink to="/userprofile" class="ts-dropdown-link">Thông tin người dùng</RouterLink></li>
              </template>
            </ul>
          </div>
        </template>

        <RouterLink to="/" class="brand-wordmark">Testskin</RouterLink>
      </div>

      <!-- CENTER: Nav Links (desktop) -->
      <nav class="ts-navbar-center hidden lg:flex">
        <template v-if="role === 'staff'">
          <RouterLink to="/dashboard"    class="ts-nav-link" active-class="ts-nav-link--active">Thống kê</RouterLink>
          <RouterLink to="/products"     class="ts-nav-link" active-class="ts-nav-link--active">Sản phẩm</RouterLink>
          <RouterLink to="/orderpending" class="ts-nav-link flex items-center gap-1.5" active-class="ts-nav-link--active">
            Đơn đặt hàng
            <span v-if="pendingCount > 0" class="ts-badge-pending animate-pulse">{{ pendingCount }}</span>
          </RouterLink>
          <RouterLink to="/brands"       class="ts-nav-link" active-class="ts-nav-link--active">Thương hiệu</RouterLink>
          <RouterLink to="/ingredients"  class="ts-nav-link" active-class="ts-nav-link--active">Thành phần</RouterLink>
          <RouterLink to="/banners"      class="ts-nav-link" active-class="ts-nav-link--active">Quảng cáo</RouterLink>
          <RouterLink to="/promotions"   class="ts-nav-link" active-class="ts-nav-link--active">Khuyến mãi</RouterLink>
          <RouterLink to="/contacts"     class="ts-nav-link" active-class="ts-nav-link--active">Liên hệ</RouterLink>
          <RouterLink to="/reviews"      class="ts-nav-link" active-class="ts-nav-link--active">Bình luận</RouterLink>
          <RouterLink to="/topics"       class="ts-nav-link" active-class="ts-nav-link--active">Chủ đề</RouterLink>
          <RouterLink to="/settings"     class="ts-nav-link" active-class="ts-nav-link--active">Cài đặt</RouterLink>
          <RouterLink to="/activity-log" class="ts-nav-link" active-class="ts-nav-link--active">Lịch sử</RouterLink>
          <RouterLink to="/users"        class="ts-nav-link" active-class="ts-nav-link--active">Người dùng</RouterLink>
          <RouterLink to="/staffs"       class="ts-nav-link" active-class="ts-nav-link--active">Nhân viên</RouterLink>
          <RouterLink to="/staffprofile" class="ts-nav-link" active-class="ts-nav-link--active">Thông tin NV</RouterLink>
        </template>
        <template v-if="role === 'user'">
          <RouterLink to="/products"    class="ts-nav-link" active-class="ts-nav-link--active">Sản phẩm</RouterLink>
          <RouterLink to="/diagnosis"   class="ts-nav-link" active-class="ts-nav-link--active">✨ Chuẩn đoán AI</RouterLink>
          <RouterLink to="/ordercheck"  class="ts-nav-link" active-class="ts-nav-link--active">Đơn hàng</RouterLink>
          <RouterLink to="/userprofile" class="ts-nav-link" active-class="ts-nav-link--active">Tài khoản</RouterLink>
        </template>
      </nav>

      <!-- RIGHT: Cart + Auth -->
      <div class="ts-navbar-end">
        <!-- Cart -->
        <RouterLink v-if="role === 'user'" to="/cart" class="ts-cart-btn" aria-label="Giỏ hàng">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span v-if="cartCount > 0" class="ts-cart-badge">{{ cartCount }}</span>
        </RouterLink>

        <!-- Auth -->
        <template v-if="!username">
          <RouterLink to="/user/login" class="ts-btn-login">Đăng Nhập</RouterLink>
        </template>
        <template v-else-if="role === 'user'">
          <RouterLink to="/userprofile" class="ts-user-greeting">
            <span class="ts-greeting-dot"></span>
            <span>{{ username }}</span>
          </RouterLink>
        </template>
        <template v-else-if="role === 'staff'">
          <RouterLink to="/staffprofile" class="ts-user-greeting">
            <span class="ts-greeting-dot ts-greeting-dot--staff"></span>
            <span>{{ username }}</span>
          </RouterLink>
        </template>
      </div>

    </div>
  </header>
</template>

<style scoped>
/* =====================
   TESTSKIN NAVBAR STYLES
   ===================== */

.ts-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 253, 249, 0.90);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(196, 149, 106, 0.20);
  box-shadow:
    0 1px 0 rgba(196, 149, 106, 0.10),
    0 4px 24px rgba(45, 27, 61, 0.07);
}

.ts-navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  gap: 1rem;
}

/* ---- Start ---- */
.ts-navbar-start {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* ---- Center ---- */
.ts-navbar-center {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
}

/* ---- End ---- */
.ts-navbar-end {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* ---- Nav Link ---- */
.ts-nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: oklch(32% 0.05 310deg);
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ts-nav-link:hover {
  color: oklch(62% 0.15 15deg);
  background: oklch(95% 0.03 15deg);
}

.ts-nav-link--active {
  color: oklch(58% 0.16 15deg) !important;
  font-weight: 700 !important;
  background: oklch(96% 0.04 15deg);
}

/* ---- Mobile Toggle ---- */
.ts-menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  border: 1px solid oklch(88% 0.03 30deg);
  background: transparent;
  cursor: pointer;
  color: oklch(35% 0.05 310deg);
  transition: background 0.2s ease;
}
.ts-menu-toggle:hover {
  background: oklch(94% 0.015 30deg);
}

/* ---- Dropdown ---- */
.dropdown {
  position: relative;
}

.ts-dropdown-menu {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  background: rgba(255, 253, 249, 0.98);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(196, 149, 106, 0.2);
  border-radius: 0.875rem;
  padding: 0.5rem;
  list-style: none;
  margin: 0;
  box-shadow: 0 8px 32px rgba(45, 27, 61, 0.12), 0 2px 8px rgba(196, 149, 106, 0.1);
  z-index: 200;
}

.dropdown:focus-within .ts-dropdown-menu {
  display: block;
}

.ts-dropdown-link {
  display: block;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: oklch(32% 0.05 310deg);
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.ts-dropdown-link:hover {
  background: oklch(94% 0.03 15deg);
  color: oklch(58% 0.16 15deg);
}

/* ---- Pending Badge ---- */
.ts-badge-pending {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: oklch(58% 0.22 25deg);
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  border-radius: 9999px;
  line-height: 1;
}

/* ---- Cart Button ---- */
.ts-cart-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 0.625rem;
  color: oklch(32% 0.05 310deg);
  background: transparent;
  border: 1px solid oklch(90% 0.015 30deg);
  text-decoration: none;
  transition: all 0.2s ease;
}

.ts-cart-btn:hover {
  background: oklch(94% 0.03 15deg);
  border-color: oklch(80% 0.09 15deg);
  color: oklch(58% 0.16 15deg);
}

.ts-cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: linear-gradient(135deg, oklch(62% 0.15 15deg), oklch(68% 0.14 25deg));
  color: white;
  font-size: 0.62rem;
  font-weight: 800;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* ---- Login Button ---- */
.ts-btn-login {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 0.625rem;
  text-decoration: none;
  background: linear-gradient(135deg, oklch(62% 0.15 15deg), oklch(68% 0.14 25deg));
  color: white;
  box-shadow: 0 2px 12px oklch(65% 0.15 15deg / 0.3);
  transition: all 0.2s ease;
}

.ts-btn-login:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px oklch(65% 0.15 15deg / 0.4);
}

/* ---- User Greeting ---- */
.ts-user-greeting {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: oklch(30% 0.06 310deg);
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid oklch(88% 0.03 30deg);
  transition: all 0.2s ease;
  background: rgba(255, 253, 249, 0.6);
}

.ts-user-greeting:hover {
  border-color: oklch(75% 0.09 15deg);
  background: oklch(97% 0.02 15deg);
  color: oklch(58% 0.16 15deg);
}

.ts-greeting-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: oklch(62% 0.15 15deg);
  flex-shrink: 0;
}

.ts-greeting-dot--staff {
  background: oklch(55% 0.14 220deg);
}

/* ---- Responsive ---- */
@media (max-width: 1024px) {
  .ts-navbar-inner {
    padding: 0 1rem;
    height: 56px;
  }
}
</style>