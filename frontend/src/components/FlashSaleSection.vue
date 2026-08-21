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
  <div class="bg-[#9A5B32] rounded-3xl p-6 md:p-8 text-[#FAF8F5] shadow-xl relative overflow-hidden font-sans border border-[#854B26] text-left">
    <!-- Header with Timer -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/20 pb-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="text-2xl animate-pulse">⚡</span>
        <h2 class="font-serif text-2xl md:text-3xl uppercase tracking-wider text-white">
          Ưu Đãi Trong Ngày
        </h2>
        <span class="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold">
          Limited
        </span>
      </div>

      <!-- Countdown Widget -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-light text-amber-100 uppercase tracking-widest mr-1 hidden sm:inline">Kết thúc sau:</span>
        <div class="flex gap-1.5 font-mono text-sm font-bold text-[#9A5B32]">
          <span class="bg-[#FAF8F5] px-2.5 py-1 rounded-lg shadow-sm">{{ hours }}</span>
          <span class="text-white text-base self-center">:</span>
          <span class="bg-[#FAF8F5] px-2.5 py-1 rounded-lg shadow-sm">{{ minutes }}</span>
          <span class="text-white text-base self-center">:</span>
          <span class="bg-[#FAF8F5] px-2.5 py-1 rounded-lg shadow-sm">{{ seconds }}</span>
        </div>
      </div>
    </div>

    <!-- Navigation and Slider Container -->
    <div class="relative group">
      <!-- Left arrow -->
      <button
        @click="scrollLeft"
        class="absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#FAF8F5] text-[#2A2723] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-white transition duration-200 z-10"
        aria-label="Scroll left"
      >
        ‹
      </button>

      <!-- Horizontal Scrollable Container -->
      <div
        ref="scrollContainer"
        class="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-none snap-x snap-mandatory"
      >
        <div
          v-for="product in products"
          :key="product._id"
          class="w-64 md:w-72 flex-shrink-0 snap-start bg-[#FAF8F5] text-[#2A2723] rounded-2xl overflow-hidden shadow-sm border border-[#EBE7DF]"
        >
          <div class="h-full flex flex-col justify-between">
            <ProductCard :product="product" class="border-0 shadow-none hover:shadow-none hover:translate-y-0" />

            <!-- Items Sold indicator -->
            <div class="px-5 pb-5">
              <div class="flex justify-between text-[10px] text-[#8C8275] font-semibold mb-1.5">
                <span>Đã bán: {{ product.sold_quantity || 12 }}</span>
                <span>Còn: {{ product.quantity }}</span>
              </div>
              <div class="w-full h-1.5 bg-[#EBE7DF] rounded-full overflow-hidden">
                <div
                  class="h-full bg-[#9A5B32] rounded-full"
                  :style="{ width: `${Math.min(100, ((product.sold_quantity || 12) / ((product.sold_quantity || 12) + product.quantity)) * 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right arrow -->
      <button
        @click="scrollRight"
        class="absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#FAF8F5] text-[#2A2723] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-white transition duration-200 z-10"
        aria-label="Scroll right"
      >
        ›
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
