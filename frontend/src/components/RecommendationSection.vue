<script setup>
import ProductCard from './ProductCard.vue';

defineProps({
  products: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: "Sản phẩm được đề xuất bởi AI"
  },
  subtitle: {
    type: String,
    default: "Dựa trên hàng triệu lượt chẩn đoán và khuyến nghị điều trị của Bác sĩ chuyên khoa"
  }
});
</script>

<template>
  <div class="bg-gradient-to-br from-emerald-50/40 via-teal-50/40 to-slate-50 p-6 md:p-10 rounded-3xl border border-emerald-100/40 shadow-sm">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
      <div class="text-left">
        <span class="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 tracking-wider uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md mb-2">
          ✨ Gợi ý cá nhân hóa
        </span>
        <h2 class="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
          {{ title }}
        </h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">
          {{ subtitle }}
        </p>
      </div>
      
      <div class="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer">
        <span>Xem thêm danh mục gợi ý</span>
        <span>→</span>
      </div>
    </div>

    <!-- Product Grid -->
    <div v-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <div 
        v-for="product in products" 
        :key="product._id"
        class="bg-white rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md"
      >
        <ProductCard :product="product" />
      </div>
    </div>
    
    <div v-else class="flex flex-col items-center justify-center py-16 bg-white/60 rounded-2xl border border-dashed border-emerald-200">
      <span class="text-4xl mb-2">🤖</span>
      <p class="text-sm font-bold text-emerald-400">Không có gợi ý nào tại thời điểm này</p>
      <RouterLink to="/diagnosis" class="text-xs font-bold text-emerald-600 underline mt-1">Bắt đầu chẩn đoán da AI ngay</RouterLink>
    </div>
  </div>
</template>
