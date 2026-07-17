<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import OrderService from "../services/order.service";
import { push } from "notivue";

const router = useRouter();
const username = computed(() => localStorage.getItem("username"));
const role = computed(() => localStorage.getItem("role"));

const borrowService = new OrderService();
const pendingCount = ref(0);
let countInterval = null;

const searchQuery = ref("");

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

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/products', query: { q: searchQuery.value } });
  }
};

const triggerVoiceSearch = () => {
  push.info("🎙️ Chức năng tìm kiếm giọng nói đang được kích hoạt... Nói để tìm!");
  // Mock voice search behavior after 2s
  setTimeout(() => {
    searchQuery.value = "Kem dưỡng ẩm Centella";
    handleSearch();
  }, 2000);
};

const triggerImageSearch = () => {
  push.info("📷 Mở máy ảnh để quét da hoặc tìm kiếm sản phẩm qua hình ảnh!");
  router.push("/diagnosis");
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  push.success("Đăng xuất thành công!");
  router.push("/");
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

onMounted(() => {
  fetchPendingCounts();
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
  <div class="w-full flex flex-col z-50 relative">
    <!-- 1. TOP INFORMATION BAR -->
    <div class="bg-gradient-to-r from-emerald-900 via-emerald-950 to-green-950 text-white text-[11px] md:text-xs py-2 px-4 shadow-sm border-b border-emerald-900/50">
      <div class="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-4">
          <a href="tel:18006821" class="flex items-center gap-1 hover:text-emerald-250 transition font-black">
            <span class="material-symbols-outlined text-sm align-middle">call</span>
            <span>Hotline:</span>
            <span class="text-emerald-400">1800.6821</span>
            <span class="text-slate-400 font-normal">(Miễn phí)</span>
          </a>
          <span class="text-slate-700 hidden sm:inline">|</span>
          <span class="hidden sm:inline text-slate-300 flex items-center gap-1">
            <span class="material-symbols-outlined text-sm align-middle">smartphone</span>
            <span>Tải ứng dụng Testskin AI</span>
          </span>
        </div>
        
        <div class="flex items-center gap-4">
          <span class="text-emerald-400 font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-sm align-middle">local_shipping</span>
            <span>Miễn phí vận chuyển đơn từ 150k</span>
          </span>
          <span class="text-slate-700 hidden md:inline">|</span>
          <RouterLink to="/promotions" class="hover:text-emerald-200 transition text-yellow-400 font-bold hidden md:inline flex items-center gap-1">
            <span class="material-symbols-outlined text-sm align-middle text-yellow-400">local_fire_department</span>
            <span>Siêu Sale Da Liễu: Giảm tới 50%</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- 2. STICKY HEADER -->
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition duration-300">
      <div class="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
        
        <!-- Left: Brand Logo & Mobile toggle -->
        <div class="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <div v-if="username" class="dropdown lg:hidden">
            <button tabindex="0" class="p-2 rounded-xl text-slate-600 hover:bg-slate-50 transition" aria-label="Open mobile menu">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <ul tabindex="0" class="absolute left-0 mt-3 w-56 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 z-50 space-y-1">
              <template v-if="role === 'staff'">
                <li><RouterLink to="/dashboard" class="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Thống kê</RouterLink></li>
                <li><RouterLink to="/products" class="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Sản phẩm</RouterLink></li>
                <li><RouterLink to="/orderpending" class="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Đơn hàng ({{ pendingCount }})</RouterLink></li>
                <li><RouterLink to="/users" class="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Người dùng</RouterLink></li>
                <li><button @click="logout" class="block w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl">Đăng xuất</button></li>
              </template>
              <template v-else>
                <li><RouterLink to="/products" class="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Cửa hàng</RouterLink></li>
                <li><RouterLink to="/diagnosis" class="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Chẩn đoán AI</RouterLink></li>
                <li><RouterLink to="/ordercheck" class="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Đơn hàng</RouterLink></li>
                <li><RouterLink to="/userprofile" class="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Tài khoản</RouterLink></li>
                <li><button @click="logout" class="block w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl">Đăng xuất</button></li>
              </template>
            </ul>
          </div>
          
          <RouterLink to="/" class="flex items-center gap-1">
            <span class="material-symbols-outlined text-3xl text-emerald-600">stethoscope</span>
            <span class="brand-wordmark font-black text-xl md:text-2xl tracking-tight">Testskin</span>
          </RouterLink>
        </div>

        <!-- Center: Large Search Bar (voice & image search support) -->
        <div class="flex-grow max-w-xl hidden md:flex items-center relative">
          <form @submit.prevent="handleSearch" class="w-full relative flex items-center">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Tìm kiếm dược mỹ phẩm, loại da, thành phần..."
              class="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white px-5 py-3 pr-24 rounded-full text-sm font-semibold outline-none transition duration-300"
            />
            
            <div class="absolute right-3 flex items-center gap-1.5">
              <button 
                type="button" 
                @click="triggerVoiceSearch"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition"
                title="Tìm kiếm giọng nói"
              >
                <span class="material-symbols-outlined text-xl">mic</span>
              </button>
              
              <button 
                type="button" 
                @click="triggerImageSearch"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition"
                title="Quét da AI / Tìm bằng ảnh"
              >
                <span class="material-symbols-outlined text-xl">photo_camera</span>
              </button>
              
              <button 
                type="submit"
                class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition"
                title="Tìm kiếm"
              >
                <span class="material-symbols-outlined text-lg text-white">search</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Actions Menu (Login, Cart, Notifications, Wishlist) -->
        <div class="flex items-center gap-3 md:gap-5">
          <!-- Wishlist (Mocked link) -->
          <RouterLink 
            to="/userprofile" 
            class="w-10 h-10 rounded-full flex items-center justify-center border border-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 hover:border-emerald-100 transition duration-300 relative"
            title="Sản phẩm yêu thích"
          >
            <span class="material-symbols-outlined text-xl">favorite</span>
          </RouterLink>

          <!-- Notifications (Mocked Link) -->
          <RouterLink 
            to="/userprofile"
            class="w-10 h-10 rounded-full flex items-center justify-center border border-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 hover:border-emerald-100 transition duration-300 relative"
            title="Thông báo"
          >
            <span class="material-symbols-outlined text-xl">notifications</span>
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
              3
            </span>
          </RouterLink>

          <!-- Shopping Cart with badge -->
          <RouterLink 
            v-if="role !== 'staff'"
            to="/cart" 
            class="w-10 h-10 rounded-full flex items-center justify-center border border-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 hover:border-emerald-100 transition duration-300 relative"
            title="Giỏ hàng"
          >
            <span class="material-symbols-outlined text-xl">shopping_cart</span>
            <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
              {{ cartCount }}
            </span>
          </RouterLink>

          <!-- User Profile Dropdown / Login -->
          <template v-if="!username">
            <RouterLink 
              to="/user/login" 
              class="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold px-5 py-2.5 rounded-full text-xs md:text-sm shadow-md hover:shadow-lg transition duration-300"
            >
              Đăng Nhập
            </RouterLink>
          </template>
          
          <template v-else>
            <div class="dropdown dropdown-end">
              <button tabindex="0" class="flex items-center gap-1.5 focus:outline-none border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full transition duration-300 text-slate-800">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-xs font-black">{{ username }}</span>
                <span class="text-[9px]">▼</span>
              </button>
              
              <ul tabindex="0" class="absolute right-0 mt-3 w-52 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 z-50 space-y-1">
                <!-- Staff Portal link -->
                <li v-if="role === 'staff'">
                  <RouterLink to="/dashboard" class="block px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-xl">
                    📊 Thống kê Dashboard
                  </RouterLink>
                </li>
                
                <li>
                  <RouterLink :to="role === 'staff' ? '/staffprofile' : '/userprofile'" class="block px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-xl">
                    👤 Trang Cá Nhân
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/ordercheck" class="block px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-xl">
                    📦 Lịch Sử Đơn Hàng
                  </RouterLink>
                </li>
                <li class="border-t border-slate-50 pt-1.5 mt-1.5">
                  <button @click="logout" class="block w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl">
                    👋 Đăng Xuất
                  </button>
                </li>
              </ul>
            </div>
          </template>
        </div>

      </div>
    </header>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
}
.dropdown-end .absolute {
  right: 0;
}
.dropdown:focus-within ul {
  display: block;
}
ul {
  display: none;
}
</style>