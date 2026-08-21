<script setup>
import ProductCard from './ProductCard.vue';

defineProps({
  products: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: "Sản phẩm được gợi ý bởi AI"
  },
  subtitle: {
    type: String,
    default: "Dựa trên mô hình y khoa chẩn đoán da liễu chuẩn xác"
  }
});
</script>

<template>
  <div class="bg-[#F4F1EA] p-6 md:p-10 rounded-3xl border border-[#EBE7DF] text-left font-sans">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
      <div>
        <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4A5D4E] tracking-widest uppercase bg-[#FAF8F5] border border-[#EBE7DF] px-2.5 py-1 rounded-full mb-2">
          ✨ Gợi ý cá nhân hóa
        </span>
        <h2 class="font-serif text-2xl md:text-3xl text-[#2A2723] font-normal leading-tight">
          {{ title }}
        </h2>
        <p class="text-xs md:text-sm text-[#6B6357] font-light mt-1">
          {{ subtitle }}
        </p>
      </div>

      <RouterLink to="/diagnosis" class="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E] hover:underline">
        Thực hiện chẩn đoán AI →
      </RouterLink>
    </div>

    <!-- Product Grid -->
    <div v-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <ProductCard v-for="product in products" :key="product._id" :product="product" />
    </div>

    <div v-else class="flex flex-col items-center justify-center py-16 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#EBE7DF]">
      <span class="material-symbols-outlined text-4xl text-[#4A5D4E] mb-2">smart_toy</span>
      <p class="text-xs font-semibold text-[#2A2723]">Chưa có gợi ý nào tại thời điểm này</p>
      <RouterLink to="/diagnosis" class="text-xs text-[#4A5D4E] underline mt-1 font-medium">Bắt đầu chẩn đoán da AI ngay</RouterLink>
    </div>
  </div>
</template>
