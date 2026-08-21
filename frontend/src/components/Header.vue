<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import OrderService from "../services/order.service";
import NotificationService from "../services/notification.service";
import { push } from "notivue";

const router = useRouter();
const username = computed(() => localStorage.getItem("username"));
const role = computed(() => localStorage.getItem("role"));
const normalizedRole = computed(() => (role.value || "").toUpperCase());

const borrowService = new OrderService();
const pendingCount = ref(0);
let countInterval = null;

const notifications = ref([]);
const unreadNotificationCount = computed(() => notifications.value.filter(n => !n.isRead).length);

const searchQuery = ref("");
const showSearchModal = ref(false);

const fetchPendingCounts = async () => {
  if (normalizedRole.value === 'STAFF' || normalizedRole.value === 'ADMIN') {
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

const fetchNotifications = async () => {
  if (username.value) {
    try {
      notifications.value = await NotificationService.getMyNotifications();
    } catch (error) {
      console.log("Failed to load notifications", error);
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Vừa xong';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return past.toLocaleDateString('vi-VN');
};

const markNotificationRead = async (notif) => {
  try {
    await NotificationService.markAsRead(notif._id);
    await fetchNotifications();
    if (notif.link) {
      router.push(notif.link);
    }
  } catch (error) {
    console.log(error);
  }
};

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    showSearchModal.value = false;
    router.push({ path: '/products', query: { q: searchQuery.value } });
  }
};

const triggerVoiceSearch = () => {
  push.info("🎙️ Chức năng tìm kiếm giọng nói đang hoạt động...");
  setTimeout(() => {
    searchQuery.value = "Kem dưỡng ẩm Centella";
    handleSearch();
  }, 1800);
};

const triggerImageSearch = () => {
  showSearchModal.value = false;
  router.push("/diagnosis");
};

const logout = () => {
  localStorage.removeItem("authenticateToken");
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("id");
  localStorage.removeItem("avatar");
  push.success("Đăng xuất thành công!");
  router.push("/");
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

onMounted(() => {
  fetchPendingCounts();
  fetchNotifications();
  countInterval = setInterval(() => {
    fetchPendingCounts();
    fetchNotifications();
  }, 15000); 
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
  <div class="w-full flex flex-col z-50 relative font-sans">
    <!-- 1. TOP ANNOUNCEMENT BAR -->
    <div class="bg-[#064E3B] text-[#FAF9F3] text-[11px] md:text-xs py-2 px-4 tracking-wider uppercase font-semibold text-center border-b border-[#053B2C]">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <span class="hidden md:inline text-[10px] tracking-widest text-[#D5E5DC]">SKIN MEDI AI — BOTANICAL & CLINICAL DERMATOLOGY</span>
        <span class="w-full md:w-auto font-bold">✨ Miễn phí giao hàng toàn quốc cho đơn từ 99.000đ</span>
        <span class="hidden md:inline text-[11px]">Hotline: <a href="tel:18006821" class="font-bold underline hover:text-amber-200">1800.6821</a></span>
      </div>
    </div>

    <!-- 2. STICKY EDITORIAL HEADER -->
    <header class="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EBE7DF] transition duration-300">
      <div class="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        
        <!-- Left: Navigation Links & Search Trigger -->
        <nav class="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-[#17352B]">
          <RouterLink to="/products" class="hover:text-[#087443] transition-colors py-2">Sản phẩm</RouterLink>
          <RouterLink to="/promotions" class="hover:text-[#087443] transition-colors py-2 text-[#B8860B] font-extrabold">Khuyến mãi</RouterLink>
          <RouterLink to="/diagnosis" class="hover:text-[#087443] transition-colors py-2 flex items-center gap-1.5 font-extrabold text-[#087443]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#087443] animate-ping"></span>
            AI Phân tích da
          </RouterLink>
          <button @click="showSearchModal = true" class="hover:text-[#087443] transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined text-base">search</span>
            <span>Tìm kiếm</span>
          </button>
        </nav>

        <!-- Mobile Menu Trigger -->
        <div class="lg:hidden flex items-center gap-2">
          <button @click="showSearchModal = true" class="p-2 text-[#2A2723]" title="Tìm kiếm">
            <span class="material-symbols-outlined text-2xl">search</span>
          </button>
          
          <div class="dropdown">
            <button tabindex="0" class="p-2 text-[#2A2723]" aria-label="Open mobile menu">
              <span class="material-symbols-outlined text-2xl">menu</span>
            </button>
            
            <ul tabindex="0" class="absolute left-0 mt-3 w-60 bg-[#FAF8F5] border border-[#EBE7DF] shadow-2xl rounded-2xl p-3 z-50 space-y-2 uppercase text-xs tracking-wider">
              <li><RouterLink to="/products" class="block px-4 py-2 text-[#2A2723] hover:bg-[#EBE7DF] rounded-xl font-bold">Sản phẩm</RouterLink></li>
              <li><RouterLink to="/diagnosis" class="block px-4 py-2 text-[#4A5D4E] hover:bg-[#EBE7DF] rounded-xl font-bold">✨ AI Phân tích da</RouterLink></li>
              <li><RouterLink to="/ordercheck" class="block px-4 py-2 text-[#2A2723] hover:bg-[#EBE7DF] rounded-xl font-bold">Tra cứu đơn hàng</RouterLink></li>
              <li v-if="['STAFF','ADMIN'].includes((role||'').toUpperCase())"><RouterLink to="/dashboard" class="block px-4 py-2 text-[#2A2723] hover:bg-[#EBE7DF] rounded-xl font-bold">Quản trị Dashboard</RouterLink></li>
              <li v-if="username"><button @click="logout" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold">Đăng xuất</button></li>
            </ul>
          </div>
        </div>

        <!-- Center: BRAND LOGO -->
        <div class="flex items-center justify-center">
          <RouterLink to="/" class="group flex flex-col items-center">
            <span class="font-sans text-2xl md:text-3xl tracking-tight text-[#064E3B] font-extrabold group-hover:text-[#087443] transition-colors">
              SKIN MEDI <span class="italic font-light text-[#087443]">AI</span>
            </span>
            <span class="text-[9px] uppercase tracking-[0.25em] text-[#496057] -mt-1 font-bold">Dermatology & Botanical</span>
          </RouterLink>
        </div>

        <!-- Right: Account / Notifications / Cart -->
        <div class="flex items-center gap-4 text-xs font-medium text-[#2A2723]">
          
          <!-- Notifications -->
          <div v-if="username" class="dropdown dropdown-end relative">
            <button tabindex="0" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#EBE7DF]/60 transition text-[#2A2723] relative" title="Thông báo">
              <span class="material-symbols-outlined text-xl">notifications</span>
              <span v-if="unreadNotificationCount > 0" class="absolute top-1.5 right-1.5 bg-[#008F6B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs border border-white">
                {{ unreadNotificationCount }}
              </span>
            </button>
            
            <div tabindex="0" class="dropdown-content z-50 menu p-0 shadow-2xl bg-white border border-[#E1ECE7] rounded-3xl w-[450px] sm:w-[500px] max-w-[calc(100vw-32px)] overflow-hidden mt-4 text-[#123F38]">
              <!-- Triangle pointer arrow -->
              <div class="absolute -top-2 right-4 w-4 h-4 bg-white border-t border-l border-[#E1ECE7] rotate-45 z-10 hidden sm:block"></div>
              
              <!-- Popup Header -->
              <div class="relative bg-[#FFFDF8] px-6 py-5 border-b border-[#E1ECE7] flex justify-between items-center z-20">
                <h3 class="text-sm font-black uppercase tracking-wider text-[#005B4F] m-0">Thông báo của bạn</h3>
                <span class="text-[11px] font-extrabold text-[#008F6B] px-2.5 py-0.5 bg-[#E8F7EF] rounded-full uppercase tracking-wider">Cập nhật mới</span>
              </div>

              <!-- Notifications List -->
              <div class="max-h-[380px] overflow-y-auto overflow-x-hidden relative z-20 bg-white" style="scrollbar-width: thin;">
                <div v-if="notifications.length === 0" class="py-12 px-6 text-center text-[#6F7F7A] text-xs font-medium">
                  Chưa có thông báo nào dành cho bạn.
                </div>
                <div v-else class="divide-y divide-[#E1ECE7]">
                  <div v-for="notif in notifications" :key="notif._id" 
                       @click="markNotificationRead(notif)" 
                       class="flex gap-4 p-5 hover:bg-[#FFFDF8]/80 transition cursor-pointer text-xs select-none"
                       :class="{ 'bg-[#E8F7EF]/30 font-bold': !notif.isRead }">
                    
                    <!-- Icon based on type -->
                    <div class="flex-shrink-0 w-9 h-9 rounded-full bg-[#E8F7EF] flex items-center justify-center text-[#005B4F]">
                      <span v-if="notif.type === 'ORDER_CREATED' || notif.type === 'order'" class="material-symbols-outlined text-lg">shopping_bag</span>
                      <span v-else-if="notif.type === 'ORDER_SHIPPING'" class="material-symbols-outlined text-lg">local_shipping</span>
                      <span v-else-if="notif.type === 'ORDER_CONFIRMED'" class="material-symbols-outlined text-lg">inventory_2</span>
                      <span v-else-if="notif.type === 'ORDER_DELIVERED'" class="material-symbols-outlined text-lg">package_2</span>
                      <span v-else-if="notif.type === 'ORDER_CANCELLED'" class="material-symbols-outlined text-lg">cancel</span>
                      <span v-else-if="notif.type === 'VOUCHER' || notif.type === 'PROMOTION'" class="material-symbols-outlined text-lg">featured_seasonal_and_gifts</span>
                      <span v-else-if="notif.type === 'LOW_STOCK'" class="material-symbols-outlined text-lg">warning</span>
                      <span v-else class="material-symbols-outlined text-lg">campaign</span>
                    </div>

                    <!-- Content -->
                    <div class="flex-grow min-w-0 space-y-1 text-left">
                      <div class="flex items-start justify-between gap-2">
                        <p class="font-bold text-[#123F38] text-xs leading-snug break-words overflow-wrap-anywhere whitespace-normal flex-grow">{{ notif.title }}</p>
                        <span v-if="!notif.isRead" class="w-2 h-2 rounded-full bg-[#008F6B] flex-shrink-0 mt-1"></span>
                      </div>
                      <p class="text-[11px] text-[#6F7F7A] font-medium leading-relaxed break-words overflow-wrap-anywhere whitespace-normal">{{ notif.message }}</p>
                      <p class="text-[10px] text-[#8A9692] font-semibold flex items-center gap-1">
                        <span class="material-symbols-outlined text-[10px]">schedule</span>
                        <span>{{ formatDate(notif.createdAt) }}</span>
                      </p>
                    </div>

                  </div>
                </div>
              </div>

              <!-- Popup Footer -->
              <div class="bg-[#FFFDF8] border-t border-[#E1ECE7] py-4 text-center z-20">
                <RouterLink :to="normalizedRole === 'STAFF' || normalizedRole === 'ADMIN' ? '/orderpending' : '/ordercheck'" 
                            class="inline-flex items-center justify-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#005B4F] hover:text-[#008F6B] transition-colors">
                  <span>Xem tất cả thông báo</span>
                  <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Wishlist -->
          <RouterLink to="/userprofile" class="hidden sm:flex w-9 h-9 rounded-full items-center justify-center hover:bg-[#EBE7DF]/60 transition text-[#2A2723]" title="Sản phẩm yêu thích">
            <span class="material-symbols-outlined text-xl">favorite</span>
          </RouterLink>

          <!-- Cart Icon -->
          <RouterLink v-if="normalizedRole !== 'STAFF' && normalizedRole !== 'ADMIN'" to="/cart" class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#EBE7DF]/60 transition text-[#2A2723] relative" title="Giỏ hàng">
            <span class="material-symbols-outlined text-xl">shopping_bag</span>
            <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-[#4A5D4E] text-[#FAF8F5] text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {{ cartCount }}
            </span>
          </RouterLink>

          <!-- Login / Profile Button -->
          <template v-if="!username">
            <RouterLink to="/user/login" class="hidden sm:inline-block px-5 py-2 border border-[#2A2723] text-[#2A2723] hover:bg-[#2A2723] hover:text-[#FAF8F5] transition duration-300 rounded-full text-xs font-semibold tracking-wider uppercase">
              Đăng Nhập
            </RouterLink>
          </template>
          
          <template v-else>
            <div class="dropdown dropdown-end relative">
              <button tabindex="0" class="flex items-center gap-1.5 border border-[#8C8275]/40 px-3 py-1.5 rounded-full text-xs font-semibold text-[#2A2723] hover:border-[#4A5D4E]">
                <span>{{ username }}</span>
                <span class="text-[10px]">▼</span>
              </button>
              
              <ul tabindex="0" class="absolute right-0 mt-3 w-52 bg-[#FAF8F5] border border-[#EBE7DF] shadow-2xl rounded-2xl p-2 z-50 space-y-1 text-xs font-semibold">
                <li v-if="normalizedRole === 'STAFF' || normalizedRole === 'ADMIN'"><RouterLink to="/dashboard" class="block px-4 py-2 hover:bg-[#EBE7DF] rounded-xl text-[#4A5D4E]">📊 Quản trị Dashboard</RouterLink></li>
                <li><RouterLink :to="normalizedRole === 'STAFF' || normalizedRole === 'ADMIN' ? '/staffprofile' : '/userprofile'" class="block px-4 py-2 hover:bg-[#EBE7DF] rounded-xl text-[#2A2723]">👤 Hồ sơ cá nhân</RouterLink></li>
                <li><RouterLink :to="normalizedRole === 'STAFF' || normalizedRole === 'ADMIN' ? '/orderpending' : '/ordercheck'" class="block px-4 py-2 hover:bg-[#EBE7DF] rounded-xl text-[#2A2723]">📦 {{ normalizedRole === 'STAFF' || normalizedRole === 'ADMIN' ? 'Quản lý đơn hàng' : 'Đơn mua của tôi' }}</RouterLink></li>
                <li class="border-t border-[#EBE7DF] pt-1 mt-1"><button @click="logout" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold">👋 Đăng xuất</button></li>
              </ul>
            </div>
          </template>

        </div>

      </div>
    </header>

    <!-- SEARCH OVERLAY MODAL -->
    <div v-if="showSearchModal" class="fixed inset-0 z-50 bg-[#2A2723]/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
      <div class="bg-[#FAF8F5] border border-[#EBE7DF] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-300">
        <button @click="showSearchModal = false" class="absolute top-4 right-4 text-[#8C8275] hover:text-[#2A2723] text-xl font-bold">✕</button>
        <h3 class="font-serif text-2xl text-[#2A2723] mb-4">Tìm kiếm sản phẩm & dược mỹ phẩm</h3>
        
        <form @submit.prevent="handleSearch" class="relative flex items-center">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Nhập tên sản phẩm, tình trạng da (ví dụ: mụn, da khô, Niacinamide)..." 
            class="w-full bg-white border border-[#EBE7DF] focus:border-[#4A5D4E] text-[#2A2723] text-sm px-5 py-4 rounded-2xl outline-none pr-28 shadow-inner"
            autofocus
          />
          <div class="absolute right-3 flex items-center gap-1">
            <button type="button" @click="triggerVoiceSearch" class="p-2 text-[#8C8275] hover:text-[#4A5D4E]" title="Tìm bằng giọng nói">
              <span class="material-symbols-outlined text-lg">mic</span>
            </button>
            <button type="button" @click="triggerImageSearch" class="p-2 text-[#8C8275] hover:text-[#4A5D4E]" title="Tìm bằng AI quét da">
              <span class="material-symbols-outlined text-lg">photo_camera</span>
            </button>
            <button type="submit" class="btn btn-sm bg-[#4A5D4E] text-white border-none rounded-xl font-bold px-4">Tìm</button>
          </div>
        </form>

        <div class="mt-4 flex flex-wrap gap-2 items-center text-xs text-[#8C8275]">
          <span class="font-semibold">Gợi ý từ khóa:</span>
          <button @click="searchQuery = 'mụn'; handleSearch()" class="px-3 py-1 bg-white border border-[#EBE7DF] rounded-full hover:border-[#4A5D4E]"># Mụn trứng cá</button>
          <button @click="searchQuery = 'da khô'; handleSearch()" class="px-3 py-1 bg-white border border-[#EBE7DF] rounded-full hover:border-[#4A5D4E]"># Cấp ẩm da khô</button>
          <button @click="searchQuery = 'nhạy cảm'; handleSearch()" class="px-3 py-1 bg-white border border-[#EBE7DF] rounded-full hover:border-[#4A5D4E]"># Da nhạy cảm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown:focus-within ul {
  display: block;
}
ul {
  display: none;
}
</style>