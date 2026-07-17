<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import ProductCard from './ProductCard.vue';
import { push } from 'notivue';

const props = defineProps({
  products: {
    type: Array,
    required: true
  }
});

const hours = ref("00");
const minutes = ref("00");
const seconds = ref("00");
let countdownInterval = null;

// Target: end of today
const calculateTimeLeft = () => {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const diff = endOfDay.getTime() - now.getTime();

  if (diff <= 0) {
    hours.value = "00";
    minutes.value = "00";
    seconds.value = "00";
    return;
  }

  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  hours.value = h.toString().padStart(2, '0');
  minutes.value = m.toString().padStart(2, '0');
  seconds.value = s.toString().padStart(2, '0');
};

onMounted(() => {
  calculateTimeLeft();
  countdownInterval = setInterval(calculateTimeLeft, 1000);
});

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
});

const scrollContainer = ref(null);

const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -320, behavior: 'smooth' });
  }
};

const scrollRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: 320, behavior: 'smooth' });
  }
};
</script>

<template>
  <div class="bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
    <!-- Header with Timer -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/20 pb-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="text-3xl animate-bounce">⚡</span>
        <h2 class="text-2xl md:text-3xl font-black uppercase tracking-wider text-white" style="color: #ffffff !important;">
          Giá Sốc Mỗi Ngày
        </h2>
        <span class="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style="color: #ffffff !important;">
          Giới hạn
        </span>
      </div>
      
      <!-- Countdown Widget -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-emerald-100 uppercase tracking-widest mr-1 hidden sm:inline" style="color: rgba(255, 255, 255, 0.9) !important;">Kết thúc trong:</span>
        <div class="flex gap-1.5 font-mono text-sm font-black text-emerald-700">
          <span class="bg-white px-2.5 py-1.5 rounded-lg shadow-sm">{{ hours }}</span>
          <span class="text-white text-lg self-center" style="color: #ffffff !important;">:</span>
          <span class="bg-white px-2.5 py-1.5 rounded-lg shadow-sm">{{ minutes }}</span>
          <span class="text-white text-lg self-center" style="color: #ffffff !important;">:</span>
          <span class="bg-white px-2.5 py-1.5 rounded-lg shadow-sm">{{ seconds }}</span>
        </div>
      </div>
    </div>
    
    <!-- Navigation and Slider Container -->
    <div class="relative group">
      <!-- Left arrow -->
      <button 
        @click="scrollLeft" 
        class="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-slate-50 transition duration-200 z-10 border border-slate-100"
        aria-label="Scroll left"
      >
        ◀
      </button>
      
      <!-- Horizontal Scrollable Container -->
      <div 
        ref="scrollContainer"
        class="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-none snap-x snap-mandatory"
      >
        <div 
          v-for="product in products" 
          :key="product._id"
          class="w-64 md:w-72 flex-shrink-0 snap-start bg-white text-slate-800 rounded-2xl overflow-hidden shadow"
        >
          <!-- Embed ProductCard logic but custom design or just use ProductCard with customized styles -->
          <div class="h-full flex flex-col justify-between">
            <ProductCard :product="product" class="border-0 shadow-none hover:shadow-none hover:translate-y-0" />
            
            <!-- Items Sold indicator -->
            <div class="px-5 pb-5">
              <div class="flex justify-between text-[10px] text-slate-400 font-bold mb-1.5">
                <span>Đã bán: {{ product.sold_quantity || Math.floor(Math.random() * 20) + 5 }}</span>
                <span>Chỉ còn: {{ product.quantity }}</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full"
                  :style="{ width: `${Math.min(100, ((product.sold_quantity || 15) / ((product.sold_quantity || 15) + product.quantity)) * 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right arrow -->
      <button 
        @click="scrollRight" 
        class="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-slate-50 transition duration-200 z-10 border border-slate-100"
        aria-label="Scroll right"
      >
        ▶
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-none {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
