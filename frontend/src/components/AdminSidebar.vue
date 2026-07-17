<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const currentPath = computed(() => route.path);

const isActive = (path) => currentPath.value.startsWith(path);
</script>

<template>
  <aside class="bg-gray-900 text-gray-300 w-64 min-h-screen flex flex-col transition-all duration-300 z-20 shrink-0">
    <div class="h-16 flex items-center justify-center bg-gray-950 shadow-md border-b border-gray-800">
      <RouterLink to="/dashboard" class="flex items-center gap-2 text-white font-black text-2xl tracking-tight">
        <span class="text-emerald-500">T</span>estskin <span class="text-xs bg-emerald-600 px-1.5 py-0.5 rounded text-white ml-1">ADMIN</span>
      </RouterLink>
    </div>

    <div class="overflow-y-auto flex-1 py-4 custom-scrollbar">
      <ul class="space-y-1 px-3">
        <li>
          <RouterLink to="/dashboard" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/dashboard') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">dashboard</span>
            Trang chủ
          </RouterLink>
        </li>
        
        <li class="pt-4 pb-1">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4">Bán hàng</span>
        </li>
        <li>
          <RouterLink to="/orderpending" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/orderpending') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">shopping_cart</span>
            Quản lý đơn hàng
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/products" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/products') || isActive('/product/') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">inventory_2</span>
            Quản lý sản phẩm
          </RouterLink>
        </li>

        <li class="pt-4 pb-1">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4">Kho & Mua hàng</span>
        </li>
        <li>
          <RouterLink to="/suppliers" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/suppliers') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">local_shipping</span>
            Nhà cung cấp
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/imports" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/imports') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">receipt_long</span>
            Nhập hàng (Kho)
          </RouterLink>
        </li>

        <li class="pt-4 pb-1">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4">Tài khoản</span>
        </li>
        <li>
          <RouterLink to="/users" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/users') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">group</span>
            Khách hàng
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/staffs" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/staffs') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            Nhân viên
          </RouterLink>
        </li>

        <li class="pt-4 pb-1">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4">Marketing & Nội dung</span>
        </li>
        <li>
          <RouterLink to="/posts" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/posts') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">article</span>
            Quản lý Bài viết
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/banners" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/banners') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">view_carousel</span>
            Quản lý Banner
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/promotions" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/promotions') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">local_offer</span>
            Khuyến mãi
          </RouterLink>
        </li>
        
        <li class="pt-4 pb-1">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4">Hệ thống</span>
        </li>
        <li>
          <RouterLink to="/comment-settings" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/comment-settings') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">forum</span>
            Cấu hình bình luận
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/settings" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/settings') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">settings</span>
            Cài đặt
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/activity-log" 
            class="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
            :class="isActive('/activity-log') ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'">
            <span class="material-symbols-outlined text-[18px]">history</span>
            Nhật ký hoạt động
          </RouterLink>
        </li>
      </ul>
    </div>
  </aside>
</template>

<style scoped>
/* Google Material Design pattern for active icons */
.bg-emerald-600 .material-symbols-outlined {
  font-variation-settings: 'FILL' 1;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #4b5563;
}
</style>
