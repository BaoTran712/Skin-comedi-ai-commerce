<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const banners = ref([
  {
    id: 1,
    title: "Chẩn Đoán Da Bằng Công Nghệ AI",
    subtitle: "Chụp ảnh hoặc tải lên hình ảnh vùng da để AI phân tích và gợi ý liệu trình điều trị phù hợp nhất.",
    cta: "Chẩn đoán ngay",
    link: "/diagnosis",
    bg: "linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    title: "Dược Mỹ Phẩm Trị Mụn Chuyên Sâu",
    subtitle: "Giảm mụn, mờ thâm và phục hồi hàng rào bảo vệ da với các sản phẩm khuyên dùng từ Bác sĩ Da liễu.",
    cta: "Mua ngay",
    link: "/products?q=mụn",
    bg: "linear-gradient(135deg, #15803D 0%, #16A34A 50%, #22C55E 100%)",
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    title: "Chăm Sóc Làn Da Nhạy Cảm",
    subtitle: "Giải pháp làm dịu mẩn đỏ, căng rát và tăng cường sức đề kháng cho làn da cực kỳ nhạy cảm.",
    cta: "Tìm hiểu thêm",
    link: "/products?q=nhạy cảm",
    bg: "linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #14B8A6 100%)",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800"
  }
]);

const currentIndex = ref(0);
let autoPlayInterval = null;

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % banners.value.length;
};

const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + banners.value.length) % banners.value.length;
};

const setSlide = (index) => {
  currentIndex.value = index;
};

onMounted(() => {
  autoPlayInterval = setInterval(nextSlide, 6000);
});

onUnmounted(() => {
  if (autoPlayInterval) clearInterval(autoPlayInterval);
});
</script>

<template>
  <div class="relative w-full h-[360px] md:h-[450px] overflow-hidden rounded-3xl shadow-xl bg-slate-900 group">
    <!-- Slides -->
    <div 
      class="flex w-full h-full transition-transform duration-700 ease-out"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div 
        v-for="slide in banners" 
        :key="slide.id" 
        class="w-full h-full flex-shrink-0 relative flex items-center"
        :style="{ background: slide.bg }"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/25 z-10"></div>
        
        <!-- Content -->
        <div class="absolute inset-0 grid grid-cols-1 lg:grid-cols-12 items-center px-8 md:px-16 z-20 gap-8">
          <div class="lg:col-span-7 text-white text-left space-y-4 md:space-y-6">
            <span class="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase" style="color: #ffffff !important;">
              Xu Hướng Công Nghệ 2026
            </span>
            <h2 class="text-3xl md:text-5xl font-black leading-tight tracking-tight drop-shadow-md" style="color: #ffffff !important;">
              {{ slide.title }}
            </h2>
            <p class="text-sm md:text-lg leading-relaxed max-w-xl" style="color: rgba(255, 255, 255, 0.9) !important;">
              {{ slide.subtitle }}
            </p>
            <div class="pt-2">
              <RouterLink 
                :to="slide.link" 
                class="inline-flex items-center justify-center bg-white font-extrabold px-6 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition duration-300"
                style="color: #16A34A !important;"
              >
                {{ slide.cta }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="stroke: #16A34A;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </RouterLink>
            </div>
          </div>
          
          <div class="hidden lg:flex lg:col-span-5 h-full items-center justify-center relative">
            <div class="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 rotate-3 hover:rotate-0 transition duration-500">
              <img :src="slide.image" :alt="slide.title" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Arrows -->
    <button 
      @click="prevSlide" 
      class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/25 transition duration-300 z-30"
      aria-label="Previous Slide"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button 
      @click="nextSlide" 
      class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/25 transition duration-300 z-30"
      aria-label="Next Slide"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Indicators -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
      <button 
        v-for="(slide, index) in banners" 
        :key="'dot-' + slide.id" 
        @click="setSlide(index)"
        class="h-2.5 rounded-full transition-all duration-300"
        :class="currentIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'"
        :aria-label="`Go to slide ${index + 1}`"
      ></button>
    </div>
  </div>
</template>
