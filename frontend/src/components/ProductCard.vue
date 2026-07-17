<script setup>
import { useRouter } from "vue-router";
import { ref, computed, onMounted } from 'vue';
import BrandService from "../services/brand.service";
import ProductService from "../services/product.service";
import { push } from "notivue";
import { onUnmounted } from 'vue';

const role = computed(() => localStorage.getItem("role"));
const router = useRouter();
const brandService = new BrandService();
const productService = new ProductService();

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
});

const loading = ref(true);
const isFlashSaleActive = ref(false);
const timeLeft = ref("");
let timerInterval = null;

const updateFlashSale = () => {
  if (!props.product?.flash_sale_end_time || !props.product?.flash_sale_price) {
    isFlashSaleActive.value = false;
    return;
  }
  const now = new Date().getTime();
  const endTime = new Date(props.product.flash_sale_end_time).getTime();
  const distance = endTime - now;

  if (distance < 0) {
    isFlashSaleActive.value = false;
    timeLeft.value = "";
    clearInterval(timerInterval);
    return;
  }

  isFlashSaleActive.value = true;
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  timeLeft.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

onMounted(() => {
  updateFlashSale();
  timerInterval = setInterval(updateFlashSale, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const goToOrderProduct = (product_id) => {
  if (props.product?.quantity <= 0) {
    push.error("Không thể đặt hàng do sản phẩm đã hết");
  }
  else {
    router.push({ name: "order.add", params: { id: product_id } });
  }
};

const goToEditProduct = (product_id) => {
  router.push({ name: "product.edit", params: { id: product_id } });
};

const productImage = computed(() => {
  const url = props.product?.image;
  return url ? encodeURI(url) : `https://picsum.photos/seed/${ encodeURIComponent( props.product?.title ) }/800`;
});

function handleImgError(event) {
  event.target.src = `https://picsum.photos/seed/${ encodeURIComponent( props.product?.title ) }/800`;
}

const handleAddToCart = () => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = savedCart.find(item => item.product._id === props.product._id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        savedCart.push({ product: props.product, quantity: 1 });
    }
    
    localStorage.setItem("cart", JSON.stringify(savedCart));
    push.success(`Đã thêm ${props.product.title} vào giỏ hàng`);
};

</script>

<template>
  <div class="flex flex-col h-full bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border border-gray-100">
    <!-- Image Section -->
    <RouterLink :to="{ name: 'product.detail', params: { id: product._id } }" class="h-56 w-full relative overflow-hidden bg-gray-100 block">
      <div v-if=" loading " class="skeleton h-full w-full"></div>
      <img :alt="product.title" @load="loading = false" @error="handleImgError" :class=" { 'opacity-0': loading, 'scale-110 group-hover:scale-100': !loading } "
        :src=" productImage "
        class="h-full w-full object-cover transition-transform duration-700 ease-out" />
      
      <!-- Flash Sale Badge -->
      <div v-if="isFlashSaleActive" class="absolute top-3 right-3 bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-red-500/40 flex flex-col items-center border border-red-400 backdrop-blur-md bg-opacity-90">
        <span class="flex items-center gap-1"><span class="animate-pulse">⚡</span> FLASH SALE</span>
        <span class="text-[10px] font-mono mt-0.5">{{ timeLeft }}</span>
      </div>

      <!-- Out of Stock Overlay -->
      <div v-if="product.quantity <= 0" class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
        <span class="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-bold shadow-lg">Hết hàng</span>
      </div>
    </RouterLink>

    <!-- Content Section -->
    <div class="p-5 flex flex-col flex-grow text-left">
      <div class="flex-grow">
        <div class="flex items-center justify-between mb-1">
          <span class="text-eyebrow">{{ product.brand_id?.name || 'Testskin' }}</span>
          <span v-if="product.expiry_date" class="text-[10px] text-gray-400">HSD: {{ product.expiry_date }}</span>
        </div>
        <RouterLink :to="{ name: 'product.detail', params: { id: product._id } }" class="block">
          <h3 class="product-title mb-2 line-clamp-2 hover:text-primary transition-colors text-slate-800">{{ product.title }}</h3>
        </RouterLink>
        
        <!-- Tags -->
        <div class="flex flex-wrap gap-1 mb-4">
          <span v-for="type in product.skin_type" :key="type" class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-md border border-emerald-100 capitalize">{{ type }}</span>
          <span v-for="path in product.pathology" :key="path" class="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-medium rounded-md border border-teal-100 capitalize">{{ path }}</span>
        </div>
        
        <p class="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{{ product.usage }}</p>
      </div>

      <div class="flex items-end justify-between mt-auto">
        <div class="flex flex-col">
          <template v-if="isFlashSaleActive">
            <span class="text-xs line-through text-gray-400 price-text">{{ `${ product.price.toLocaleString() }đ` }}</span>
            <span class="text-xl text-price text-red-600">{{ `${ product.flash_sale_price.toLocaleString() }đ` }}</span>
          </template>
          <template v-else>
            <span class="text-xl text-price text-gray-900">{{ `${ product.price.toLocaleString() }đ` }}</span>
          </template>
        </div>
        
        <div class="text-[10px] text-right">
          <span :class="{
            'text-emerald-600': product.quantity >= 45,
            'text-amber-600': product.quantity < 45 && product.quantity > 0,
            'text-red-600 font-bold': product.quantity > 0 && product.quantity < 15,
            'text-gray-400': product.quantity <= 0
          }">
            {{ product.quantity > 0 ? `Còn ${product.quantity}` : 'Liên hệ' }}
          </span>
        </div>
      </div>

      <div class="mt-5 pt-4 border-t border-gray-50 flex gap-2">
        <template v-if=" role === 'staff' ">
          <button @click=" goToEditProduct( props.product?._id )"
            class="btn btn-outline btn-sm flex-grow rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900">
            Chỉnh sửa
          </button>
        </template>
        <template v-else>
          <button @click=" goToOrderProduct( props.product?._id )"
            :disabled="product.quantity <= 0"
            class="btn btn-primary btn-sm flex-grow rounded-xl shadow-lg shadow-primary/20">
            {{ product.quantity > 0 ? 'Đặt ngay' : 'Hết hàng' }}
          </button>
          <button @click=" handleAddToCart " class="btn btn-square btn-outline btn-sm rounded-xl border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>