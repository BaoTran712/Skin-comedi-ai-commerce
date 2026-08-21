<template>
  <footer class="relative bg-white border-t border-[#E5ECE8] font-sans text-left z-40">

    <!-- Top brand accent line -->
    <div class="w-full h-[3px] bg-gradient-to-r from-[#087F5B] via-[#00A878] to-[#087F5B]"></div>

    <!-- Main footer content -->
    <div class="max-w-7xl mx-auto px-6 md:px-10 py-14">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

        <!-- ── BRAND COL ── -->
        <div class="lg:col-span-4 flex flex-col gap-5">

          <!-- Logo -->
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-[26px] font-extrabold tracking-tight text-[#123F35] leading-none">SKIN MEDI</span>
              <span class="text-[26px] font-light italic text-[#008A63] leading-none">AI</span>
            </div>
            <div class="flex items-center gap-2 mt-1.5">
              <div class="h-px w-8 bg-[#C9DDD6]"></div>
              <span class="text-[9px] uppercase tracking-[0.25em] font-bold text-[#087F5B]">Dermatology &amp; Botanical</span>
            </div>
          </div>

          <!-- Tagline -->
          <p class="text-sm leading-[1.75] text-[#52635D] max-w-sm">
            Hệ thống bán sản phẩm chăm sóc da chính hãng kết hợp công nghệ AI hỗ trợ phân tích tình trạng da và tư vấn phác đồ cá nhân hóa.
          </p>

          <!-- Trust badges -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-[#315F53] bg-[#EBF4EF] border border-[#C9DDD6] rounded-full px-2.5 py-1">
              <svg class="w-3 h-3 text-[#087F5B]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Hàng Chính Hãng
            </span>
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-[#315F53] bg-[#EBF4EF] border border-[#C9DDD6] rounded-full px-2.5 py-1">
              <svg class="w-3 h-3 text-[#087F5B]" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
              Tư Vấn Dược Sĩ
            </span>
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-[#315F53] bg-[#EBF4EF] border border-[#C9DDD6] rounded-full px-2.5 py-1">
              <svg class="w-3 h-3 text-[#087F5B]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
              AI Phân Tích Da
            </span>
          </div>

          <!-- Social Icons -->
          <div class="flex items-center gap-2.5 pt-1">
            <a href="#" aria-label="Facebook"
              class="w-9 h-9 rounded-full bg-[#F2F7F4] border border-[#D5E6DE] text-[#315F53] flex items-center justify-center transition-all duration-200 hover:bg-[#087F5B] hover:text-white hover:border-[#087F5B] hover:shadow-md hover:shadow-emerald-200/60 hover:-translate-y-0.5">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
              </svg>
            </a>
            <a href="#" aria-label="Instagram"
              class="w-9 h-9 rounded-full bg-[#F2F7F4] border border-[#D5E6DE] text-[#315F53] flex items-center justify-center transition-all duration-200 hover:bg-[#087F5B] hover:text-white hover:border-[#087F5B] hover:shadow-md hover:shadow-emerald-200/60 hover:-translate-y-0.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" aria-label="TikTok"
              class="w-9 h-9 rounded-full bg-[#F2F7F4] border border-[#D5E6DE] text-[#315F53] flex items-center justify-center transition-all duration-200 hover:bg-[#087F5B] hover:text-white hover:border-[#087F5B] hover:shadow-md hover:shadow-emerald-200/60 hover:-translate-y-0.5">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.53.02C13.84 0 15 1 15 2.3c0 3.4 2.7 6.1 6.1 6.1v3.3c-2.6 0-5-1.2-6.5-3.2v8.8c0 3.7-3 6.7-6.7 6.7S1.2 20.9 1.2 17.2c0-3.7 3-6.7 6.7-6.7 1.1 0 2.1.3 3 .7V.02h1.63z"/>
              </svg>
            </a>
            <a href="#" aria-label="YouTube"
              class="w-9 h-9 rounded-full bg-[#F2F7F4] border border-[#D5E6DE] text-[#315F53] flex items-center justify-center transition-all duration-200 hover:bg-[#087F5B] hover:text-white hover:border-[#087F5B] hover:shadow-md hover:shadow-emerald-200/60 hover:-translate-y-0.5">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- ── VỀ SKINMEDI AI ── -->
        <div class="lg:col-span-2 space-y-4">
          <h4 class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35]">
            Về SkinMedi AI
          </h4>
          <ul class="space-y-2.5">
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Giới thiệu thương hiệu</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Hệ thống nhà thuốc</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Đội ngũ chuyên môn</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Tuyển dụng dược sĩ</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Liên hệ</a></li>
          </ul>
        </div>

        <!-- ── HỖ TRỢ KHÁCH HÀNG ── -->
        <div class="lg:col-span-2 space-y-4">
          <h4 class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35]">
            Hỗ Trợ Khách Hàng
          </h4>
          <ul class="space-y-2.5">
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Tra cứu đơn hàng</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Chính sách giao hàng</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Hướng dẫn mua hàng</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Phương thức thanh toán</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Chính sách đổi trả</a></li>
          </ul>
        </div>

        <!-- ── CHÍNH SÁCH ── -->
        <div class="lg:col-span-2 space-y-4">
          <h4 class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35]">
            Chính Sách
          </h4>
          <ul class="space-y-2.5">
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Chính sách bảo mật</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Điều khoản sử dụng</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Quy chế hoạt động</a></li>
            <li><a href="#" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200 hover:underline underline-offset-2">Giải quyết khiếu nại</a></li>
          </ul>
        </div>

        <!-- ── LIÊN HỆ ── -->
        <div class="lg:col-span-2 space-y-4">
          <h4 class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35]">
            Liên Hệ
          </h4>
          <ul class="space-y-3.5">
            <li class="flex items-start gap-2.5">
              <span class="mt-0.5 shrink-0 text-[#087F5B]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </span>
              <span class="text-sm text-[#52635D] leading-relaxed">Đường 3/2, Xuân Khánh,<br>Ninh Kiều, Cần Thơ</span>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="shrink-0 text-[#087F5B]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </span>
              <a href="tel:18006821" class="text-sm font-semibold text-[#123F35] hover:text-[#008A63] transition-colors duration-200">1800 6821</a>
            </li>
            <li class="flex items-center gap-2.5">
              <span class="shrink-0 text-[#087F5B]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </span>
              <a href="mailto:support@skinmedi.vn" class="text-sm text-[#315F53] hover:text-[#008A63] transition-colors duration-200">support@skinmedi.vn</a>
            </li>
            <!-- Giờ mở cửa -->
            <li class="flex items-center gap-2.5">
              <span class="shrink-0 text-[#087F5B]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2"/>
                </svg>
              </span>
              <span class="text-sm text-[#52635D]">8:00 – 21:00 hàng ngày</span>
            </li>
          </ul>
        </div>

      </div><!-- /grid -->

      <!-- ── NEWSLETTER STRIP ── -->
      <div class="mt-12 rounded-2xl border border-[#D5E6DE] bg-[#F4FAF7] px-7 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div class="text-center sm:text-left">
          <p class="text-sm font-semibold text-[#123F35]">Nhận tư vấn chăm sóc da miễn phí</p>
          <p class="text-xs text-[#52635D] mt-0.5">Đăng ký để nhận thông tin sản phẩm mới và lịch khuyến mãi từ SkinMedi AI.</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="email"
            placeholder="Email của bạn..."
            class="flex-grow sm:w-60 text-sm text-[#123F35] placeholder-[#A5BAB2] bg-white border border-[#C9DDD6] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#008A63]/30 focus:border-[#008A63] transition"
          />
          <button class="shrink-0 bg-[#087F5B] hover:bg-[#006B4A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200 shadow-sm shadow-emerald-700/20">
            Đăng ký
          </button>
        </div>
      </div>
    </div>

    <!-- ── BOTTOM BAR ── -->
    <div class="border-t border-[#E5ECE8] bg-[#F8FAF8]">
      <div class="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#66756F]">

        <!-- Copyright -->
        <p class="text-center md:text-left">
          © {{ new Date().getFullYear() }} <span class="font-semibold text-[#123F35]">SkinMedi AI</span>. Bảo lưu mọi quyền.
        </p>

        <!-- Certifications / Quick links -->
        <div class="flex items-center gap-4 flex-wrap justify-center">
          <a href="#" class="hover:text-[#008A63] transition-colors">Bảo mật</a>
          <span class="text-[#C9DDD6]">·</span>
          <a href="#" class="hover:text-[#008A63] transition-colors">Điều khoản</a>
          <span class="text-[#C9DDD6]">·</span>
          <a href="#" class="hover:text-[#008A63] transition-colors">Cookies</a>
        </div>

        <!-- Brand line -->
        <p class="text-[10px] uppercase tracking-[0.22em] font-bold text-[#087F5B] text-center md:text-right">
          Natural Skincare × Dermatology AI
        </p>

      </div>
    </div>

  </footer>
</template>