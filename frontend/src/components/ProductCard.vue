<script setup>
import { useRouter } from "vue-router";
import { ref, computed, onMounted, onUnmounted } from 'vue';
import BrandService from "../services/brand.service";
import ProductService from "../services/product.service";
import WishlistService from "../services/wishlist.service";
import { push } from "notivue";

const role = computed(() => (localStorage.getItem("role") || "").toUpperCase());
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

const isFavorite = ref(false);
const username = computed(() => localStorage.getItem("username"));

const fetchWishlistStatus = async () => {
  if (username.value && role.value !== 'staff') {
    try {
      const wishlist = await WishlistService.getWishlist();
      isFavorite.value = wishlist.products.some(p => p._id === props.product._id || p === props.product._id);
    } catch (error) {
      console.log("Failed to fetch wishlist status", error);
    }
  }
};

const toggleWishlist = async () => {
  if (!username.value) {
    push.error("Vui lòng đăng nhập để lưu sản phẩm yêu thích!");
    router.push("/user/login");
    return;
  }
  try {
    if (isFavorite.value) {
      await WishlistService.removeProduct(props.product._id);
      isFavorite.value = false;
      push.info(`Đã xóa khỏi danh sách yêu thích`);
    } else {
      await WishlistService.addProduct(props.product._id);
      isFavorite.value = true;
      push.success(`Đã thêm vào danh sách yêu thích`);
    }
  } catch (error) {
    console.error("Toggle Wishlist Error:", error);
    push.error("Đã xảy ra lỗi khi cập nhật danh sách yêu thích");
  }
};

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
  fetchWishlistStatus();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const goToOrderProduct = (product_id) => {
  if (props.product?.quantity <= 0) {
    push.error("Không thể đặt hàng do sản phẩm đã hết");
  }
  else if (props.product?.has_variants) {
    push.info("Vui lòng chọn phân loại sản phẩm trước khi đặt hàng!");
    router.push({ name: "product.detail", params: { id: product_id } });
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
  return url ? encodeURI(url) : `/images/product-missing.svg`;
});

const handleImageError = (event) => {
  event.target.src = `/images/product-missing.svg`;
};

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
  <div class="flex flex-col h-full bg-[#FFFFFF] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 group border border-[#EBE7DF] font-sans text-left">
    <!-- Image Section -->
    <div class="h-64 w-full relative overflow-hidden bg-[#F4F1EA] block">
      <!-- Wishlist Heart Button -->
      <button v-if="role !== 'STAFF' && role !== 'ADMIN'"
              @click.prevent="toggleWishlist"
              class="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition duration-300">
        <span class="material-symbols-outlined text-[18px]"
              :class="isFavorite ? 'text-red-500 font-bold' : 'text-[#8C8275]'"
              :style="isFavorite ? 'font-variation-settings: \'FILL\' 1;' : ''">
          favorite
        </span>
      </button>

      <RouterLink :to="{ name: 'product.detail', params: { id: product._id } }" class="absolute inset-0 w-full h-full block">
        <div v-if="loading" class="skeleton h-full w-full"></div>
        <img :alt="product.title" @load="loading = false" @error="handleImageError"
             :class="{ 'opacity-0': loading, 'scale-105 group-hover:scale-100': !loading }"
             referrerpolicy="no-referrer"
             :src="productImage"
             class="h-full w-full object-cover transition-transform duration-700 ease-out" />
      </RouterLink>

      <!-- Flash Sale Badge -->
      <div v-if="isFlashSaleActive" class="absolute top-3 right-3 bg-[#9A5B32] text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1">
        <span class="animate-pulse">⚡</span> FLASH SALE
      </div>

      <!-- Out of Stock Overlay -->
      <div v-if="product.quantity !== undefined && product.quantity <= 0" class="absolute inset-0 bg-[#2A2723]/30 backdrop-blur-[1px] flex items-center justify-center">
        <span class="bg-[#FAF8F5] text-[#2A2723] px-3.5 py-1.5 rounded-full text-xs font-serif italic shadow">Tạm hết hàng</span>
      </div>
    </div>

    <!-- Content Section -->
    <div class="p-5 flex flex-col flex-grow text-left justify-between">
      <div>
        <div class="flex items-center justify-between mb-1 text-[10px] text-[#496057] uppercase tracking-widest font-bold">
          <span>{{ product.brand_id?.name || 'SkinMedi AI' }}</span>
          <span v-if="product.expiry_date">HSD: {{ product.expiry_date }}</span>
        </div>

        <RouterLink :to="{ name: 'product.detail', params: { id: product._id } }" class="block">
          <h3 class="font-sans text-base text-[#064E3B] font-bold line-clamp-2 hover:text-[#087443] transition-colors leading-snug mb-2">
            {{ product.title }}
          </h3>
        </RouterLink>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1 mb-3">
          <span v-for="type in product.skin_type" :key="type" class="px-2 py-0.5 bg-[#E8F5EE] text-[#064E3B] text-[10px] font-bold rounded-md border border-[#BFD8CA] capitalize">{{ type }}</span>
          <span v-for="path in product.pathology" :key="path" class="px-2 py-0.5 bg-[#F3FAF6] text-[#496057] text-[10px] font-bold rounded-md border border-[#D5E5DC] capitalize">{{ path }}</span>
        </div>

        <p class="text-xs text-[#496057] line-clamp-2 mb-4 leading-relaxed font-medium">{{ product.usage }}</p>
      </div>

      <div>
        <!-- Price & Stock -->
        <div class="flex items-baseline justify-between border-t border-[#D5E5DC] pt-3 mt-2">
          <div class="flex flex-col">
            <template v-if="isFlashSaleActive">
              <span class="text-[11px] line-through text-[#66756E]">{{ `${product.price.toLocaleString()}đ` }}</span>
              <span class="text-base font-bold text-[#B8860B]">{{ `${product.flash_sale_price.toLocaleString()}đ` }}</span>
            </template>
            <template v-else>
              <span class="text-base font-extrabold text-[#087443]">{{ `${product.price?.toLocaleString()}đ` }}</span>
            </template>
          </div>

          <span class="text-[10px] text-[#496057] font-semibold">
            {{ (product.quantity !== undefined ? product.quantity : 50) > 0 ? `Tồn kho: ${product.quantity ?? 50}` : 'Tạm hết' }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex gap-2">
          <template v-if="role === 'STAFF' || role === 'ADMIN'">
            <button @click="goToEditProduct(props.product?._id)"
                    class="btn btn-xs flex-grow rounded-full border-[#8C8275] text-[#2A2723] hover:bg-[#2A2723] hover:text-white uppercase text-[10px] tracking-wider">
              Chỉnh sửa
            </button>
          </template>
          <template v-else>
            <button @click="goToOrderProduct(props.product?._id)"
                    :disabled="(product.quantity !== undefined ? product.quantity : 50) <= 0"
                    class="btn btn-sm flex-grow rounded-full bg-[#087443] text-white hover:bg-[#064E3B] border-none text-xs font-bold uppercase tracking-wider shadow-sm">
              {{ (product.quantity !== undefined ? product.quantity : 50) > 0 ? 'Mua ngay' : 'Hết hàng' }}
            </button>
            <button @click="handleAddToCart" class="btn btn-sm btn-square rounded-full border border-[#087443] bg-white text-[#087443] hover:bg-[#E8F5EE]">
              <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>