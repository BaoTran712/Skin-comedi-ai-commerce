<script setup>
import { ref } from 'vue';

const categories = ref([
  {
    name: "✨ Chẩn đoán AI",
    to: "/diagnosis",
    highlight: true
  },
  {
    name: "Trị mụn",
    to: "/products?q=mụn",
    dropdown: [
      { name: "Gel/Kem Trị Mụn", to: "/products?q=kem+trị+mụn" },
      { name: "Serum Đặc Trị Mụn", to: "/products?q=serum+mụn" },
      { name: "Sữa Rửa Mặt Cho Da Mụn", to: "/products?q=sữa+rửa+mặt+mụn" }
    ]
  },
  {
    name: "Dưỡng da",
    to: "/products?q=dưỡng+da",
    dropdown: [
      { name: "Toner & Nước Hoa Hồng", to: "/products?q=toner" },
      { name: "Serum & Tinh Chất", to: "/products?q=serum" },
      { name: "Mặt Nạ Dưỡng Da", to: "/products?q=mặt+nạ" }
    ]
  },
  {
    name: "Dưỡng ẩm",
    to: "/products?q=ẩm"
  },
  {
    name: "Chống nắng",
    to: "/products?q=chống+nắng"
  },
  {
    name: "Sữa rửa mặt",
    to: "/products?q=sữa+rửa+mặt"
  },
  {
    name: "Serum",
    to: "/products?q=serum"
  },
  {
    name: "Thuốc đặc trị",
    to: "/products?q=thuốc"
  },
  {
    name: "Vitamins",
    to: "/products?q=vitamin"
  },
  {
    name: "Thiết bị y tế",
    to: "/products?q=thiết+bị"
  }
]);

const activeIndex = ref(null);
const showMobileMenu = ref(false);

const toggleDropdown = (index) => {
  if (activeIndex.value === index) {
    activeIndex.value = null;
  } else {
    activeIndex.value = index;
  }
};
</script>

<template>
  <div class="bg-white border-b border-slate-100 shadow-sm relative z-40">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Desktop Navigation -->
      <div class="hidden lg:flex items-center justify-between h-14">
        <div class="flex items-center space-x-1 xl:space-x-2">
          <div 
            v-for="(cat, idx) in categories" 
            :key="idx"
            class="relative group"
          >
            <RouterLink 
              :to="cat.to"
              class="flex items-center px-3 py-2 rounded-xl text-sm font-bold transition duration-200"
              :class="[
                cat.highlight 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:from-emerald-600 hover:to-teal-700' 
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
              ]"
            >
              <span>{{ cat.name }}</span>
              <svg v-if="cat.dropdown" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 text-slate-400 group-hover:text-emerald-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </RouterLink>

            <!-- Dropdown Menu -->
            <div 
              v-if="cat.dropdown"
              class="absolute left-0 top-full pt-2 w-52 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50"
            >
              <div class="bg-white rounded-2xl border border-slate-100 shadow-xl p-2">
                <RouterLink 
                  v-for="(sub, subIdx) in cat.dropdown" 
                  :key="subIdx"
                  :to="sub.to"
                  class="block px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition"
                >
                  {{ sub.name }}
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Hotline Shortcut -->
        <a href="tel:18006821" class="flex items-center text-emerald-600 text-xs font-black tracking-wider hover:opacity-85 transition">
          <span class="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mr-2 animate-bounce">
            📞
          </span>
          <span>HOTLINE: 1800.6821 (Miễn phí)</span>
        </a>
      </div>

      <!-- Mobile Category Toggle Trigger -->
      <div class="lg:hidden flex items-center justify-between h-12">
        <button 
          @click="showMobileMenu = !showMobileMenu" 
          class="flex items-center text-slate-700 text-sm font-bold focus:outline-none"
        >
          <span class="mr-2 text-lg">☰</span> Danh Mục Sản Phẩm
        </button>
        
        <RouterLink to="/diagnosis" class="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full shadow">
          ✨ Chẩn đoán AI
        </RouterLink>
      </div>
      
      <!-- Mobile Category Drawer -->
      <div 
        v-if="showMobileMenu"
        class="lg:hidden bg-slate-50 border-t border-slate-100 py-3 space-y-1 animate-in slide-in-from-top-4 duration-200"
      >
        <div v-for="(cat, idx) in categories" :key="'mob-' + idx" class="px-2">
          <div class="flex items-center justify-between">
            <RouterLink 
              :to="cat.to"
              @click="showMobileMenu = false"
              class="block px-4 py-2.5 text-sm font-bold rounded-xl text-slate-700 hover:bg-slate-150 w-full text-left"
              :class="[cat.highlight ? 'bg-emerald-50 text-emerald-600' : '']"
            >
              {{ cat.name }}
            </RouterLink>
            
            <button 
              v-if="cat.dropdown" 
              @click="toggleDropdown(idx)"
              class="p-2 text-slate-400 focus:outline-none"
            >
              <span class="transition duration-200 block" :class="activeIndex === idx ? 'rotate-180' : ''">▼</span>
            </button>
          </div>
          
          <!-- Mobile Dropdown links -->
          <div 
            v-if="cat.dropdown && activeIndex === idx" 
            class="bg-white/80 rounded-xl mt-1 border border-slate-100 ml-4 py-1.5 space-y-1"
          >
            <RouterLink 
              v-for="(sub, subIdx) in cat.dropdown" 
              :key="'mob-sub-'+subIdx"
              :to="sub.to"
              @click="showMobileMenu = false"
              class="block px-6 py-2 text-xs font-semibold text-slate-500 hover:text-emerald-600"
            >
              {{ sub.name }}
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
