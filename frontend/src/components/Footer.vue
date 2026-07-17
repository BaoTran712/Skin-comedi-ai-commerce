<template>
  <footer class="border-t py-16 px-4 z-40 relative text-black" style="background-color: #DDE4E0; border-color: #C5CFC9;">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
      
      <!-- Logo + Brief Introduction -->
      <div class="lg:col-span-4 space-y-4">
        <div class="flex items-center gap-2 text-black">
          <span class="material-symbols-outlined text-3xl text-black">stethoscope</span>
          <span class="brand-wordmark font-black text-2xl tracking-tight !text-black" style="background: none; -webkit-text-fill-color: initial; text-fill-color: initial;">Testskin</span>
        </div>
        <p class="text-sm leading-relaxed max-w-sm text-black/80">
          Testskin là hệ thống bán lẻ dược mỹ phẩm chính hãng kết hợp công nghệ chuẩn đoán bệnh da bằng Trí Tuệ Nhân Tạo (AI), mang lại giải pháp chăm sóc toàn diện cho làn da của bạn.
        </p>
        
        <!-- Social Media Icons (styled as black text, light borders) -->
        <div class="flex gap-3.5 pt-2">
          <a href="#" class="w-9 h-9 rounded-full border border-black/20 hover:bg-black hover:text-white text-black flex items-center justify-center transition duration-300" aria-label="Facebook">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
            </svg>
          </a>
          <a href="#" class="w-9 h-9 rounded-full border border-black/20 hover:bg-black hover:text-white text-black flex items-center justify-center transition duration-300" aria-label="Instagram">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="#" class="w-9 h-9 rounded-full border border-black/20 hover:bg-black hover:text-white text-black flex items-center justify-center transition duration-300" aria-label="TikTok">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.53.02C13.84 0 15 1 15 2.3c0 3.4 2.7 6.1 6.1 6.1v3.3c-2.6 0-5-1.2-6.5-3.2v8.8c0 3.7-3 6.7-6.7 6.7S1.2 20.9 1.2 17.2c0-3.7 3-6.7 6.7-6.7 1.1 0 2.1.3 3 .7V.02h1.63z"/>
            </svg>
          </a>
          <a href="#" class="w-9 h-9 rounded-full border border-black/20 hover:bg-black hover:text-white text-black flex items-center justify-center transition duration-300" aria-label="YouTube">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.003 3.003 0 0 0-2.11 2.107C0 8.047 0 12 0 12s0 3.953.502 5.837a3.003 3.003 0 0 0 2.11 2.107c1.883.511 9.388.511 9.388.511s7.505 0 9.388-.511a3.003 3.003 0 0 0 2.11-2.107c.502-1.884.502-5.837.502-5.837s0-3.953-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>
      </div>
      
      <!-- Columns -->
      <div class="lg:col-span-2 space-y-4">
        <h4 class="text-black font-extrabold text-sm tracking-wider uppercase">Về công ty</h4>
        <ul class="space-y-2.5 text-xs">
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Giới thiệu công ty</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Hệ thống cửa hàng</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Tuyển dụng</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Liên hệ hợp tác</a></li>
        </ul>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <h4 class="text-black font-extrabold text-sm tracking-wider uppercase">Hỗ trợ khách hàng</h4>
        <ul class="space-y-2.5 text-xs">
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Tra cứu hóa đơn</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Chính sách giao hàng</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Chính sách đổi trả</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Hướng dẫn mua hàng</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Tư vấn sỉ</a></li>
        </ul>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <h4 class="text-black font-extrabold text-sm tracking-wider uppercase">Chính sách pháp lý</h4>
        <ul class="space-y-2.5 text-xs">
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Chính sách bảo mật</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Điều khoản sử dụng</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Quy chế hoạt động</a></li>
          <li><a href="#" class="hover:text-emerald-700 hover:underline transition text-black/80">Giải quyết khiếu nại</a></li>
        </ul>
      </div>

      <!-- Contact Info -->
      <div class="lg:col-span-2 space-y-4">
        <h4 class="text-black font-extrabold text-sm tracking-wider uppercase">Thông tin liên hệ</h4>
        <ul class="space-y-3 text-xs text-black/80">
          <li class="flex items-start gap-2">
            <span class="material-symbols-outlined text-lg text-black flex-shrink-0 mt-0.5">location_on</span>
            <span>Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="material-symbols-outlined text-lg text-black flex-shrink-0">call</span>
            <span>Hotline: 1800.6821</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="material-symbols-outlined text-lg text-black flex-shrink-0">mail</span>
            <span>support@testskin.vn</span>
          </li>
        </ul>
      </div>

    </div>
    
    <!-- Divider -->
    <div class="max-w-7xl mx-auto h-[1px] my-10" style="background-color: #C5CFC9;"></div>
    
    <!-- Bottom line -->
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs gap-4">
      <p class="text-black/70">© {{ new Date().getFullYear() }} Testskin. Bảo lưu mọi quyền.</p>
      <div class="flex items-center gap-6">
        <a href="#" class="hover:text-emerald-700 hover:underline transition text-black/70">Chính Sách Bảo Mật</a>
        <a href="#" class="hover:text-emerald-700 hover:underline transition text-black/70">Điều Khoản Dịch Vụ</a>
        <span class="text-emerald-700 font-bold">⚡ Phân tích da bằng AI</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
</style>