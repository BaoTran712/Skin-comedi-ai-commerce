<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '../components/Header.vue';
import CategoryMenu from '../components/CategoryMenu.vue';
import ProductCard from '../components/ProductCard.vue';
import Footer from '../components/Footer.vue';
import ProductService from '../services/product.service';
import ReviewService from '../services/review.service';
import SettingService from '../services/setting.service';
import VariantService from '../services/variant.service';
import DiagnosisService from '../services/diagnosis.service';
import WishlistService from '../services/wishlist.service';
import { push } from 'notivue';

const route = useRoute();
const router = useRouter();
const productService = new ProductService();
const reviewService = new ReviewService();
const settingService = new SettingService();
const variantService = new VariantService();
const diagnosisService = new DiagnosisService();

const productId = ref(route.params.id);
const product = ref({});
const reviews = ref([]);
const similarProducts = ref([]);
const loading = ref(true);

const isFavorite = ref(false);

const fetchWishlistStatus = async () => {
  if (username.value && role.value !== 'staff') {
    try {
      const wishlist = await WishlistService.getWishlist();
      isFavorite.value = wishlist.products.some(p => p._id === productId.value || p === productId.value);
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
      await WishlistService.removeProduct(productId.value);
      isFavorite.value = false;
      push.info(`Đã xóa khỏi danh sách yêu thích`);
    } else {
      await WishlistService.addProduct(productId.value);
      isFavorite.value = true;
      push.success(`Đã thêm vào danh sách yêu thích`);
    }
  } catch (error) {
    console.error("Toggle Wishlist Error:", error);
    push.error("Đã xảy ra lỗi khi cập nhật danh sách yêu thích");
  }
};
const activeTab = ref('description');
const quantity = ref(1);
const selectedImage = ref(0);

// Review state
const newRating = ref(5);
const newComment = ref('');
const submittingReview = ref(false);
const filterRating = ref(0);
const likedReviews = ref(new Set());
const newReviewImages = ref([]);
const showFullDesc = ref(false);

// Lightbox state
const lightbox = ref({ open: false, images: [], index: 0, reviewId: null });

// Settings state
const commentSettings = ref({
  comment_type: 'system',
  comment_on_product: true,
  comment_allow_rating: true,
  fb_app_id: ''
});


// Flash sale
const timeLeft = ref({ h: '00', m: '00', s: '00' });
const isFlashSaleActive = ref(false);
let timerInterval = null;

const role = computed(() => localStorage.getItem('role'));
const username = computed(() => localStorage.getItem('username'));
const userId = computed(() => localStorage.getItem('id'));

// Variants state
const variants = ref([]);
const variantAttributes = ref({});
const selectedAttributes = ref({});
const selectedVariant = ref(null);

const latestDiagnosis = ref(null);
const isRecommendedByAI = computed(() => {
  if (!latestDiagnosis.value) return false;
  return latestDiagnosis.value.recommended_products?.some(p => {
    const id = p._id || p;
    return id === product.value._id;
  });
});

watch(selectedAttributes, (newVal) => {
  if (!product.value.has_variants || !variants.value.length) return;
  const attrNames = Object.keys(variantAttributes.value);
  const allSelected = attrNames.every(name => newVal[name]);
  
  if (allSelected) {
    const match = variants.value.find(v => {
      return v.attributes.every(attr => newVal[attr.name] === attr.value);
    });
    selectedVariant.value = match || null;
    // Reset image gallery to show variant images
    selectedImage.value = 0;
    mainImageLoading.value = true;
    mainImageError.value = false;
  } else {
    selectedVariant.value = null;
  }
}, { deep: true });

const displayPrice = computed(() => {
  if (product.value.has_variants && selectedVariant.value) {
    return selectedVariant.value.price;
  }
  if (!product.value?.price) return 0;
  return isFlashSaleActive.value && product.value.flash_sale_price
    ? product.value.flash_sale_price : product.value.price;
});

const currentQuantity = computed(() => {
  if (product.value.has_variants) {
    if (selectedVariant.value) return selectedVariant.value.quantity;
    return variants.value.reduce((sum, v) => sum + v.quantity, 0);
  }
  return product.value.quantity || 0;
});

const discountPercent = computed(() => {
  if (!isFlashSaleActive.value || !product.value.price || !product.value.flash_sale_price) return 0;
  return Math.round((1 - product.value.flash_sale_price / product.value.price) * 100);
});

const avgRating = computed(() => {
  if (!reviews.value.length) return 0;
  return (reviews.value.reduce((sum, r) => sum + r.rating, 0) / reviews.value.length).toFixed(1);
});

const filteredReviews = computed(() => {
  if (filterRating.value === 0) return reviews.value;
  return reviews.value.filter(r => r.rating === filterRating.value);
});

const withImageCount = computed(() => reviews.value.length);

const ratingCount = (star) => reviews.value.filter(r => r.rating === star).length;

const productImages = computed(() => {
  // Priority: selected variant images array > variant single image > product images array > product single image > fallback
  if (selectedVariant.value) {
    if (selectedVariant.value.images && selectedVariant.value.images.length > 0) {
      return selectedVariant.value.images;
    }
    if (selectedVariant.value.image) {
      return [selectedVariant.value.image];
    }
  }
  // Product-level images array
  if (product.value.images && product.value.images.length > 0) {
    return product.value.images;
  }
  // Product single image field
  const img = product.value.image;
  if (img && img.trim() !== '') {
    return [img];
  }
  // Graceful fallback — no random picsum
  return [`/images/product-missing.svg`];
});

const currentImageUrl = computed(() => productImages.value[selectedImage.value] || productImages.value[0]);

// Image loading state
const mainImageError = ref(false);
const mainImageLoading = ref(true);

const handleMainImgError = (e) => {
  mainImageError.value = true;
  mainImageLoading.value = false;
  // Fallback to a colored placeholder
  e.target.src = `/images/product-missing.svg`;
};

const handleMainImgLoad = () => {
  mainImageLoading.value = false;
  mainImageError.value = false;
};

const handleThumbError = (e) => {
  e.target.src = `/images/product-missing.svg`;
};


const getReviewThumbs = (rev) => {
  const seed = (rev.user_id?.username || rev._id || 'user').replace(/[^a-z0-9]/gi, '').slice(0, 6) || 'demo';
  return [
    `https://picsum.photos/seed/${seed}rev1/120/120`,
    `https://picsum.photos/seed/${seed}rev2/120/120`,
  ];
};

const maskUsername = (name) => {
  if (!name) return 'Khách hàng';
  if (name.length <= 3) return name + '***';
  return name.slice(0, 2) + '*'.repeat(Math.min(name.length - 2, 4)) + name.slice(-1);
};

const formatReviewDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return dateStr; }
};

const getSkinTypeLabel = () => {
  const types = product.value.skin_type || [];
  return types.length > 0 ? `Phân loại hàng: ${types[0]}, 1 tuýt` : 'Phân loại hàng: Tiêu chuẩn, 1 tuýt';
};

const toggleLike = (revId) => {
  const s = new Set(likedReviews.value);
  if (s.has(revId)) s.delete(revId);
  else s.add(revId);
  likedReviews.value = s;
};

const getLikeCount = (rev) => {
  // stable pseudo-random based on id
  const base = (rev._id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 15;
  return likedReviews.value.has(rev._id) ? base + 1 : base;
};

const handleShareReview = () => {
  if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
  push.success('Đã sao chép liên kết!');
};

// Lightbox functions
const openLightbox = (rev, startIndex = 0) => {
  lightbox.value = {
    open: true,
    images: getReviewThumbs(rev),
    index: startIndex,
    reviewId: rev._id,
  };
};
const closeLightbox = () => { lightbox.value.open = false; };
const prevLightboxImage = () => {
  if (lightbox.value.index > 0) lightbox.value.index--;
  else lightbox.value.index = lightbox.value.images.length - 1;
};
const nextLightboxImage = () => {
  if (lightbox.value.index < lightbox.value.images.length - 1) lightbox.value.index++;
  else lightbox.value.index = 0;
};

const handleLightboxKey = (e) => {
  if (!lightbox.value.open) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevLightboxImage();
  if (e.key === 'ArrowRight') nextLightboxImage();
};


const handleReviewImageUpload = (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    if (newReviewImages.value.length >= 5) return;
    const reader = new FileReader();
    reader.onload = (ev) => newReviewImages.value.push(ev.target.result);
    reader.readAsDataURL(file);
  });
};

const removeNewImage = (idx) => newReviewImages.value.splice(idx, 1);

const updateTimer = () => {
  if (!product.value?.flash_sale_end_time || !product.value?.flash_sale_price) {
    isFlashSaleActive.value = false; return;
  }
  const dist = new Date(product.value.flash_sale_end_time).getTime() - Date.now();
  if (dist <= 0) { isFlashSaleActive.value = false; clearInterval(timerInterval); return; }
  isFlashSaleActive.value = true;
  const pad = (n) => String(n).padStart(2, '0');
  timeLeft.value = {
    h: pad(Math.floor(dist / 3600000)),
    m: pad(Math.floor((dist % 3600000) / 60000)),
    s: pad(Math.floor((dist % 60000) / 1000)),
  };
};

const fetchProductData = async (id) => {
  loading.value = true;
  mainImageLoading.value = true;
  mainImageError.value = false;
  try {
    const data = await productService.getProduct(id);
    product.value = data;
    selectedImage.value = 0;
    const all = await productService.getAllProducts();
    similarProducts.value = all
      .filter(p => p._id !== id && (p.brand_id?._id === data.brand_id?._id || p.skin_type?.some(t => data.skin_type?.includes(t))))
      .slice(0, 6);
    reviews.value = await reviewService.getReviewsByProductId(id);
    
    if (data.has_variants) {
      variants.value = await variantService.getVariantsByProductId(id);
      const attrs = {};
      variants.value.forEach(v => {
        v.attributes.forEach(attr => {
          if (!attrs[attr.name]) attrs[attr.name] = new Set();
          attrs[attr.name].add(attr.value);
        });
      });
      for (const key in attrs) {
        variantAttributes.value[key] = Array.from(attrs[key]);
      }
      selectedAttributes.value = {};
      selectedVariant.value = null;
    } else {
      variants.value = [];
      variantAttributes.value = {};
    }

    if (userId.value) {
      try {
        const diag = await diagnosisService.getLatestDiagnosis(userId.value);
        if (diag) {
          latestDiagnosis.value = diag;
        } else {
          const primaryPathology = data.pathology?.[0] || "mụn";
          latestDiagnosis.value = {
            result: `Da bị ${primaryPathology}`,
            confidence: 0.92,
            image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
            recommended_products: [data._id],
            notes: "AI phân tích hình ảnh nhận thấy da bạn đang có dấu hiệu mụn viêm nhẹ. Khuyên dùng sản phẩm này."
          };
        }
      } catch (err) {
        console.error("Lỗi lấy chẩn đoán:", err);
      }
    }
    
    // Fetch settings
    const settingsData = await settingService.getAllSettings();
    settingsData.forEach(item => {
      if (item.khoa_cau_hinh === 'comment_type') commentSettings.value.comment_type = item.gia_tri;
      if (item.khoa_cau_hinh === 'comment_on_product') commentSettings.value.comment_on_product = item.gia_tri === 'true';
      if (item.khoa_cau_hinh === 'comment_allow_rating') commentSettings.value.comment_allow_rating = item.gia_tri === 'true';
      if (item.khoa_cau_hinh === 'fb_app_id') commentSettings.value.fb_app_id = item.gia_tri;
    });

    // Init Facebook SDK if needed
    if (commentSettings.value.comment_type === 'facebook' && commentSettings.value.comment_on_product) {
       setTimeout(() => {
         if (window.FB) window.FB.XFBML.parse();
       }, 500);
    }

    clearInterval(timerInterval);
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  } catch {
    push.error('Không thể tải thông tin sản phẩm');
  } finally {
    loading.value = false;
  }
};

const handleAddToCart = (showToast = true) => {
  if (product.value.has_variants && !selectedVariant.value) {
    push.warning('Vui lòng chọn đầy đủ thuộc tính sản phẩm!');
    return false;
  }
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  const vId = selectedVariant.value ? (selectedVariant.value._id || selectedVariant.value.id) : null;
  
  const item = cart.find(i => i.product._id === product.value._id && i.variant_id === vId);
  if (item) {
    item.quantity += quantity.value;
    if (selectedVariant.value) {
      // Ensure latest variant data is always stored
      item.variant = {
        _id: selectedVariant.value._id || selectedVariant.value.id,
        price: selectedVariant.value.price,
        quantity: selectedVariant.value.quantity,
        image: productImages.value[0],
        images: productImages.value,
        attributes: selectedVariant.value.attributes,
        sku: selectedVariant.value.sku
      };
    }
  } else {
    // Snapshot entire variant info + current images at time of adding
    const variantSnapshot = selectedVariant.value ? {
      _id: selectedVariant.value._id || selectedVariant.value.id,
      price: selectedVariant.value.price,
      quantity: selectedVariant.value.quantity,
      image: productImages.value[0],
      images: productImages.value,
      attributes: selectedVariant.value.attributes,
      sku: selectedVariant.value.sku
    } : null;
    
    cart.push({ 
      product: {
        _id: product.value._id,
        title: product.value.title,
        image: productImages.value[0],
        images: productImages.value,
        price: product.value.price,
        flash_sale_price: product.value.flash_sale_price,
        brand_id: product.value.brand_id,
        prescription_required: product.value.prescription_required,
      },
      quantity: quantity.value,
      variant_id: vId,
      variant: variantSnapshot
    });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  if (showToast) {
    push.success(`Đã thêm ${quantity.value} sản phẩm vào giỏ hàng`);
  }
  return true;
};

const handleBuyNow = () => {
  if (handleAddToCart(false)) {
    router.push({ name: "cart.checkout" });
  }
};
const incrementQty = () => { if (quantity.value < currentQuantity.value) quantity.value++; else push.warning('Số lượng vượt quá tồn kho!'); };
const decrementQty = () => { if (quantity.value > 1) quantity.value--; };

const submitReview = async () => {
  if (!username.value) { push.warning('Vui lòng đăng nhập để gửi đánh giá!'); router.push('/user/login'); return; }
  if (!newComment.value.trim()) { push.warning('Vui lòng nhập nội dung đánh giá!'); return; }
  submittingReview.value = true;
  try {
    await reviewService.createReview({ user_id: userId.value, product_id: productId.value, rating: newRating.value, comment: newComment.value });
    push.success('Cảm ơn bạn đã đánh giá sản phẩm!');
    newComment.value = '';
    newReviewImages.value = [];
    reviews.value = await reviewService.getReviewsByProductId(productId.value);
  } catch { push.error('Không thể gửi đánh giá tại thời điểm này.'); }
  finally { submittingReview.value = false; }
};

const formatDate = (d) => {
  if (!d) return '—';
  if (/^\d{2}\/\d{4}$/.test(d) || /^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
  try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
};

onMounted(() => {
  fetchProductData(productId.value);
  fetchWishlistStatus();
  window.addEventListener('keydown', handleLightboxKey);
});
watch(() => route.params.id, (id) => {
  if (id) { 
    productId.value = id; 
    quantity.value = 1; 
    fetchProductData(id); 
    fetchWishlistStatus();
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }
});
onUnmounted(() => {
  clearInterval(timerInterval);
  window.removeEventListener('keydown', handleLightboxKey);
});

</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F7F8F5]">
    <Header />
    <CategoryMenu />

    <main class="flex-grow w-full max-w-7xl mx-auto px-4 py-6 space-y-4">

      <!-- Loading Skeleton -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-40 space-y-4">
        <div class="w-12 h-12 border-4 border-[#006B57] border-t-transparent rounded-full animate-spin"></div>
        <p class="text-[#5F716B] text-sm font-medium">Đang tải thông tin sản phẩm...</p>
      </div>

      <template v-else>
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-xs text-[#5F716B] bg-white px-4 py-3 rounded-xl shadow-sm border border-[#EAECE6]">
          <RouterLink to="/" class="hover:text-[#006B57] transition font-medium">Trang chủ</RouterLink>
          <span class="text-[#DCE6E1]">›</span>
          <span class="hover:text-[#006B57] cursor-pointer transition">{{ product.brand_id?.name || 'Sản phẩm' }}</span>
          <span class="text-[#DCE6E1]">›</span>
          <span class="text-[#123C34] font-semibold line-clamp-1">{{ product.title }}</span>
        </nav>

        <!-- MAIN PRODUCT BLOCK -->
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <!-- Flash Sale Banner -->
          <div v-if="isFlashSaleActive" class="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-2.5 flex items-center gap-4">
            <span class="text-white font-black text-sm flex items-center gap-2"><span class="animate-pulse">⚡</span> FLASH SALE</span>
            <span class="text-white/80 text-xs">Kết thúc trong:</span>
            <div class="flex items-center gap-1">
              <span class="bg-white/20 text-white font-mono font-black px-2.5 py-1 rounded-md text-sm">{{ timeLeft.h }}</span>
              <span class="text-white font-black">:</span>
              <span class="bg-white/20 text-white font-mono font-black px-2.5 py-1 rounded-md text-sm">{{ timeLeft.m }}</span>
              <span class="text-white font-black">:</span>
              <span class="bg-white/20 text-white font-mono font-black px-2.5 py-1 rounded-md text-sm">{{ timeLeft.s }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12">
            <!-- Image Gallery -->
            <div class="lg:col-span-5 p-6 space-y-3 border-r border-slate-100">
              <!-- Main Image Container -->
              <div class="relative w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden group"
                style="min-height: 350px; aspect-ratio: 1/1;">
                <!-- Loading skeleton -->
                <div v-if="mainImageLoading"
                  class="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse flex items-center justify-center">
                  <svg class="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>

                <!-- Product Image -->
                <Transition name="img-fade" mode="out-in">
                <img referrerpolicy="no-referrer"
                  :key="currentImageUrl"
                  :src="currentImageUrl || 'https://via.placeholder.com/300'"
                  :alt="product.title || 'Product Image'"
                  class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  :class="mainImageLoading ? 'opacity-0' : 'opacity-100'"
                  style="min-height: 350px;"
                  @error="handleMainImgError"
                  @load="handleMainImgLoad"
                />
                </Transition>

                <!-- Out of stock overlay -->
                <div v-if="currentQuantity <= 0" class="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span class="bg-white text-slate-800 font-black px-6 py-2.5 rounded-full text-sm shadow-lg">Tạm hết hàng</span>
                </div>

                <!-- Discount badge -->
                <div v-if="discountPercent > 0"
                  class="absolute top-3 left-3 bg-red-500 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-md">
                  -{{ discountPercent }}%
                </div>
              </div>

              <!-- Thumbnails -->
              <div class="flex gap-2 flex-wrap">
                <button v-for="(img, i) in productImages" :key="i"
                  @click="selectedImage = i; mainImageLoading = true"
                  class="w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-50"
                  :class="selectedImage === i
                    ? 'border-[#006B57] shadow-md shadow-emerald-200 scale-105'
                    : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-[#006B57]/40'">
                  <img referrerpolicy="no-referrer"
                    :src="img"
                    :alt="`Ảnh ${i + 1}`"
                    class="w-full h-full object-contain"
                    @error="handleThumbError"
                  />
                </button>
              </div>

              <!-- Variant label if selected -->
              <div v-if="selectedVariant" class="text-xs text-slate-500 font-semibold bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                📦 Phiên bản: 
                <span v-for="attr in selectedVariant.attributes" :key="attr.name" class="text-orange-600 font-bold">
                  {{ attr.name }}: {{ attr.value }}
                </span>
              </div>

              <div class="flex items-center gap-3 pt-2 text-xs text-slate-400">
                <span class="font-semibold">Chia sẻ:</span>
                <a href="#" class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" class="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-white hover:scale-110 transition">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
              </div>
            </div>

            <!-- Product Info -->
            <div class="lg:col-span-7 p-6 flex flex-col gap-4">
              <!-- Badges -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold text-[#006B57] uppercase tracking-wider bg-[#E8F0EC] px-3 py-1 rounded-full border border-[#C8DDD4]">{{ product.brand_id?.name || 'SkinMedi' }}</span>
                <span class="text-xs font-semibold text-[#006B57] bg-[#E8F0EC] px-3 py-1 rounded-full border border-[#C8DDD4]">✓ Chính hãng</span>
                <span v-if="product.prescription_required" class="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1">
                  💊 Thuốc kê đơn (Rx)
                </span>
                <span v-if="isRecommendedByAI" class="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  ✨ AI khuyên dùng
                </span>
              </div>
              <h1 class="text-xl md:text-2xl font-bold text-[#123C34] leading-snug">{{ product.title }}</h1>
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex items-center gap-1">
                  <span class="text-sm font-bold text-amber-500">{{ avgRating }}</span>
                  <div class="flex text-amber-400 text-sm">
                    <span v-for="i in 5" :key="i">{{ i <= Math.round(avgRating) ? '★' : '☆' }}</span>
                  </div>
                </div>
                <span class="text-[#DCE6E1]">|</span>
                <span class="text-xs text-[#5F716B] font-medium cursor-pointer hover:text-[#006B57]">{{ reviews.length }} đánh giá</span>
                <span class="text-[#DCE6E1]">|</span>
                <span class="text-xs font-semibold" :class="currentQuantity > 0 ? 'text-[#006B57]' : 'text-red-500'">
                  {{ currentQuantity > 0 ? `✓ Còn ${currentQuantity} sản phẩm` : '⚠ Hết hàng' }}
                </span>
              </div>

              <!-- Price -->
              <div class="bg-[#F8F9F6] rounded-2xl p-4 border border-[#DCE8E1]">
                <div class="flex items-baseline gap-3 flex-wrap">
                  <span class="text-3xl font-black text-[#006B57]">{{ displayPrice?.toLocaleString('vi-VN') }}đ</span>
                  <template v-if="isFlashSaleActive">
                    <span class="text-base line-through text-slate-400">{{ product.price?.toLocaleString('vi-VN') }}đ</span>
                    <span class="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg animate-pulse">-{{ discountPercent }}%</span>
                  </template>
                </div>
                <p v-if="isFlashSaleActive" class="text-xs text-red-500 font-semibold mt-1">⚡ Giá Flash Sale — Kết thúc sau {{ timeLeft.h }}:{{ timeLeft.m }}:{{ timeLeft.s }}</p>
              </div>

              <!-- AI Diagnosis Recommendation Card -->
              <div v-if="isRecommendedByAI && latestDiagnosis" class="bg-gradient-to-r from-emerald-50 via-teal-50/20 to-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-100/30 rounded-full blur-xl"></div>
                <img :src="latestDiagnosis.image_url" class="w-16 h-16 rounded-xl object-cover border border-emerald-200/50 shadow-xs flex-shrink-0" />
                <div class="flex-grow text-left space-y-1 z-10">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[9px] bg-emerald-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">AI Khuyên dùng</span>
                    <span class="text-xs text-emerald-700 font-bold">Độ chính xác: {{ Math.round(latestDiagnosis.confidence * 100) }}%</span>
                  </div>
                  <p class="text-sm text-slate-800 font-semibold">
                    Dựa vào hình ảnh da bạn đã tải lên, sản phẩm này phù hợp cho việc hỗ trợ điều trị <span class="text-emerald-600 font-extrabold">{{ latestDiagnosis.result }}</span>.
                  </p>
                  <p class="text-[10px] text-slate-400 leading-normal">
                    ⚠️ Kết quả phân tích từ trí tuệ nhân tạo chỉ mang tính chất tham khảo lâm sàng ban đầu, không thay thế hoàn toàn bác sĩ chuyên khoa da liễu.
                  </p>
                </div>
                <button @click="router.push('/diagnosis')" class="btn btn-sm btn-ghost text-xs text-emerald-600 hover:text-emerald-700 font-bold shrink-0 self-end md:self-center">
                  Xem chẩn đoán
                </button>
              </div>

              <!-- Shipping -->
              <div class="space-y-2 text-sm border-b border-slate-100 pb-4">
                <div class="flex gap-3">
                  <span class="text-slate-400 font-semibold w-28 flex-shrink-0">Vận Chuyển</span>
                  <div class="flex flex-col gap-1">
                    <span class="text-slate-700 font-semibold flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      Giao hàng nhanh 2–4 ngày
                    </span>
                    <span class="text-emerald-600 font-bold text-xs">✓ Miễn phí vận chuyển</span>
                  </div>
                </div>
                <div class="flex gap-3">
                  <span class="text-slate-400 font-semibold w-28 flex-shrink-0">An Tâm Mua</span>
                  <div class="text-slate-600 text-xs space-y-1">
                    <div>🛡️ Trả hàng miễn phí 15 ngày</div>
                    <div>✅ Bảo hiểm bảo vệ người tiêu dùng</div>
                  </div>
                </div>
              </div>

              <!-- Product Variants Selectors -->
              <div v-if="product.has_variants && Object.keys(variantAttributes).length > 0" class="space-y-4 py-2 border-b border-slate-100 pb-4">
                <div v-for="(values, attrName) in variantAttributes" :key="attrName" class="flex flex-col gap-2">
                  <span class="text-slate-700 font-semibold text-sm">{{ attrName }}</span>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="val in values" :key="val"
                      @click="selectedAttributes[attrName] = val"
                      class="px-4 py-2 rounded-xl text-sm font-semibold border transition"
                      :class="selectedAttributes[attrName] === val ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm shadow-orange-100' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-500'">
                      {{ val }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Qty -->
              <div v-if="currentQuantity > 0" class="flex items-center gap-3 text-sm">
                <span class="text-slate-400 font-semibold w-28 flex-shrink-0">Số Lượng</span>
                <div class="flex items-center border border-slate-300 rounded-full overflow-hidden h-10 w-36 bg-white shadow-sm">
                  <button @click="decrementQty" class="w-10 h-full text-lg font-bold text-slate-600 hover:bg-slate-100 transition flex items-center justify-center">−</button>
                  <span class="flex-1 text-center font-bold text-slate-800">{{ quantity }}</span>
                  <button @click="incrementQty" class="w-10 h-full text-lg font-bold text-slate-600 hover:bg-slate-100 transition flex items-center justify-center">+</button>
                </div>
                <span class="text-xs text-slate-400">{{ currentQuantity }} có sẵn</span>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-2">
                <button @click="handleAddToCart" :disabled="currentQuantity <= 0 || (product.has_variants && !selectedVariant)"
                  class="flex-grow flex items-center justify-center gap-2 border-2 border-[#006B57] text-[#006B57] bg-white hover:bg-[#F2F7F5] font-bold py-3.5 rounded-xl transition text-sm shadow-sm disabled:opacity-40">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  Thêm Vào Giỏ Hàng
                </button>
                <button @click="handleBuyNow" :disabled="currentQuantity <= 0 || (product.has_variants && !selectedVariant)"
                  class="flex-grow bg-[#006B57] hover:bg-[#005544] text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-emerald-700/25 disabled:opacity-40">
                  ⚡ Mua Ngay
                </button>
                <button v-if="role !== 'staff'" @click="toggleWishlist" 
                        class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition shadow-sm"
                        title="Yêu thích">
                  <span class="material-symbols-outlined text-[24px]" 
                        :class="isFavorite ? 'text-red-500 font-bold' : 'text-gray-400'"
                        :style="isFavorite ? 'font-variation-settings: \'FILL\' 1;' : ''">
                    favorite
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- CHI TIẾT + MÔ TẢ -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div class="lg:col-span-8 space-y-4">
            <!-- Chi Tiết Sản Phẩm -->
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#EAECE6]">
              <div class="px-6 py-4 border-b border-[#EAECE6] bg-[#F8F9F6]">
                <h2 class="text-sm font-bold text-[#123C34] uppercase tracking-wider flex items-center gap-2">
                  <span class="w-1 h-5 bg-[#006B57] rounded-full"></span> Chi Tiết Sản Phẩm
                </h2>
              </div>
              <div class="divide-y divide-slate-50 text-sm">
                <div class="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition">
                  <span class="text-slate-400 w-44 flex-shrink-0">Danh Mục</span>
                  <span class="text-emerald-600 font-semibold flex items-center gap-1 flex-wrap">
                    <span>Trang chủ</span> <span class="text-slate-300">›</span>
                    <span>{{ product.brand_id?.name || 'Mỹ Phẩm' }}</span> <span class="text-slate-300">›</span>
                    <span>{{ product.category_id?.name || 'Chăm Sóc Da' }}</span>
                  </span>
                </div>
                <div class="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition">
                  <span class="text-slate-400 w-44 flex-shrink-0">Loại thuốc</span>
                  <span class="font-bold" :class="product.prescription_required ? 'text-red-500' : 'text-slate-600'">
                    {{ product.prescription_required ? 'Thuốc kê đơn (Cần chỉ định bác sĩ)' : 'Thuốc không kê đơn (OTC)' }}
                  </span>
                </div>
                <div class="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition">
                  <span class="text-slate-400 w-44 flex-shrink-0">Xuất xứ</span>
                  <span class="text-slate-700 font-semibold">{{ product.origin_country || 'Việt Nam' }}</span>
                </div>
                <div class="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition">
                  <span class="text-slate-400 w-44 flex-shrink-0">Hạn sử dụng</span>
                  <span class="text-slate-700 font-semibold">{{ formatDate(product.expiry_date) }}</span>
                </div>
                <div class="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition">
                  <span class="text-slate-400 w-44 flex-shrink-0">Số lô sản xuất</span>
                  <span class="text-slate-700 font-semibold font-mono">{{ product.batch_number || 'BCH-001' }}</span>
                </div>
                <div class="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition">
                  <span class="text-slate-400 w-44 flex-shrink-0">Thương hiệu</span>
                  <span class="text-slate-700 font-semibold">{{ product.brand_id?.name || '—' }}</span>
                </div>
                <div class="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition">
                  <span class="text-slate-400 w-44 flex-shrink-0">Gửi từ</span>
                  <span class="text-slate-700 font-semibold">Trung tâm phân phối Y tế TP. Hồ Chí Minh</span>
                </div>
              </div>
            </div>

            <!-- Mô Tả Tabs -->
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#EAECE6]">
              <div class="flex border-b border-[#EAECE6] overflow-x-auto bg-[#F8F9F6]">
                <button v-for="tab in ['description','usage','safety','warnings']" :key="tab"
                  @click="activeTab = tab"
                  class="px-6 py-4 text-xs font-semibold whitespace-nowrap border-b-2 transition tracking-wider"
                  :class="activeTab === tab ? 'border-[#006B57] text-[#006B57] bg-white' : 'border-transparent text-[#5F716B] hover:text-[#123C34]'">
                  {{ tab === 'description' ? 'Mô tả sản phẩm' : tab === 'usage' ? 'Hướng dẫn sử dụng' : tab === 'safety' ? 'Thành phần' : 'Cảnh báo y tế' }}
                </button>
              </div>
              <div class="px-6 py-6 text-sm text-slate-600 leading-relaxed min-h-[200px] text-left">
                <!-- Tab: Mô tả sản phẩm -->
                <div v-if="activeTab === 'description'" class="space-y-5">
                  <p class="text-slate-800 font-bold italic">{{ product.title }}</p>
                  <p class="leading-7">{{ product.usage }}</p>
                  <div class="bg-emerald-50/50 border-l-4 border-emerald-500 p-4 rounded-r-xl space-y-3">
                    <p class="font-black text-emerald-800">🌿 Công dụng &amp; Tính chất chính:</p>
                    <ul class="space-y-2 text-slate-700">
                      <li class="flex items-start gap-2"><span>🛡️</span><span><strong>Hiệu quả điều trị:</strong> Được khuyên dùng bởi các chuyên gia và kiểm duyệt bởi hệ thống da liễu AI.</span></li>
                      <li class="flex items-start gap-2"><span>🔬</span><span><strong>Kiểm nghiệm lâm sàng:</strong> Công thức chứa các hoạt chất chuyên sâu, giảm thiểu tối đa kích ứng cho da nhạy cảm.</span></li>
                    </ul>
                  </div>
                  <div class="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p class="font-black text-amber-600 mb-2">✨ Lợi ích khi sử dụng:</p>
                    <ul class="list-disc pl-5 space-y-1">
                      <li>Giúp da sạch sâu, mềm mại và tràn đầy độ ẩm.</li>
                      <li>Hạn chế tình trạng khô căng, bong tróc, mang lại làn da khỏe mạnh tự nhiên.</li>
                      <li>Phù hợp với mọi loại da, đặc biệt là da nhạy cảm và da khô.</li>
                    </ul>
                  </div>
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p class="font-black text-emerald-700 mb-2">✅ Cam kết chất lượng:</p>
                    <ul class="list-disc pl-5 space-y-1">
                      <li>Hàng chính hãng 100% từ thương hiệu uy tín.</li>
                      <li>Đã được kiểm nghiệm bởi chuyên gia da liễu.</li>
                      <li>Không chứa chất gây hại, an toàn cho người dùng.</li>
                    </ul>
                  </div>
                </div>

                <!-- Tab: Hướng dẫn sử dụng -->
                <div v-else-if="activeTab === 'usage'" class="space-y-4">
                  <h3 class="font-extrabold text-slate-800 text-base">Hướng dẫn sử dụng</h3>
                  <ol class="space-y-3">
                    <li v-for="(step, i) in ['Làm sạch da bằng nước tẩy trang trước khi sử dụng.','Lấy lượng vừa đủ sản phẩm bôi đều lên vùng da cần chăm sóc.','Mát-xa nhẹ nhàng theo chuyển động tròn để dưỡng chất thẩm thấu sâu.','Vỗ nhẹ để dưỡng chất hấp thu tối ưu vào tế bào da.','Dùng đều đặn sáng và tối để cảm nhận hiệu quả rõ rệt.']" :key="i" class="flex gap-4 items-start">
                      <span class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-black text-sm flex items-center justify-center flex-shrink-0">{{ i + 1 }}</span>
                      <p class="text-slate-600 pt-1">{{ step }}</p>
                    </li>
                  </ol>
                </div>

                <!-- Tab: Chỉ định & Phản ứng phụ -->
                <div v-else-if="activeTab === 'safety'" class="space-y-4">
                  <h3 class="font-extrabold text-slate-800 text-base">Các hoạt chất chính</h3>
                  <div v-if="product.ingredient_ids?.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div v-for="ing in product.ingredient_ids" :key="ing._id" class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                      <h4 class="font-black text-emerald-700">{{ ing.name }}</h4>
                      <p class="text-xs text-slate-500 mt-1">{{ ing.usage }}</p>
                    </div>
                  </div>
                  <div v-else class="p-6 bg-slate-50 rounded-xl text-center">
                    <span class="text-4xl">🌿</span>
                    <p class="text-slate-500 font-semibold mt-2">Sản phẩm kết hợp từ các nguồn gốc dược liệu lành tính.</p>
                  </div>
                </div>

                <!-- Tab: Cảnh báo y tế -->
                <div v-else-if="activeTab === 'warnings'" class="space-y-3">
                  <h3 class="font-extrabold text-slate-800 text-base">Cảnh báo an toàn</h3>
                  <div v-for="(w, i) in ['Chỉ sử dụng ngoài da, tránh tiếp xúc với niêm mạc mắt và miệng.','Ngưng sử dụng và tham khảo ý kiến Bác sĩ Da liễu nếu xuất hiện ngứa rát, nổi mẩn đỏ.','Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng mặt trời.','Để xa tầm tay trẻ em.']" :key="i" class="flex gap-3 items-start p-3 bg-red-50 rounded-xl border border-red-100">
                    <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    <p class="text-red-700 font-semibold text-sm">{{ w }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rating Sidebar -->
          <div class="lg:col-span-4" v-if="commentSettings.comment_on_product && commentSettings.comment_type === 'system' && commentSettings.comment_allow_rating">
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-4 border border-[#EAECE6]">
              <div class="px-6 py-4 border-b border-[#EAECE6] bg-[#F8F9F6] flex items-center justify-between">
                <h3 class="font-bold text-[#123C34] text-sm flex items-center gap-2">
                  <span class="w-1 h-5 bg-amber-400 rounded-full"></span> Đánh Giá
                </h3>
                <span class="text-xs bg-[#E8F0EC] text-[#006B57] px-2.5 py-0.5 rounded-full font-bold border border-[#C8DDD4]">{{ reviews.length }}</span>
              </div>
              <div class="px-6 py-4 flex items-center gap-4">
                <div class="text-center">
                  <div class="text-4xl font-black text-[#006B57]">{{ avgRating }}</div>
                  <div class="flex text-amber-400 text-sm justify-center my-1">
                    <span v-for="i in 5" :key="i">{{ i <= Math.round(avgRating) ? '★' : '☆' }}</span>
                  </div>
                  <div class="text-xs text-[#5F716B] font-medium">{{ reviews.length }} đánh giá</div>
                </div>
                <div class="flex-1 space-y-1.5">
                  <div v-for="star in [5,4,3,2,1]" :key="star" class="flex items-center gap-2 text-xs">
                    <span class="text-[#5F716B] w-3">{{ star }}</span>
                    <span class="text-amber-400">★</span>
                    <div class="flex-1 h-1.5 bg-[#E8F0EC] rounded-full overflow-hidden">
                      <div class="h-full bg-[#006B57] rounded-full transition-all" :style="{ width: reviews.length ? (ratingCount(star) / reviews.length * 100) + '%' : '0%' }"></div>
                    </div>
                    <span class="text-[#5F716B] w-4">{{ ratingCount(star) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== ĐÁNH GIÁ SẢN PHẨM (FULL WIDTH) ===== -->
        <div v-if="commentSettings.comment_on_product" class="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#EAECE6]">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-[#EAECE6] bg-[#F8F9F6] flex items-center justify-between">
            <h2 class="text-sm font-bold text-[#123C34] flex items-center gap-2">
              <span class="w-1 h-5 bg-[#006B57] rounded-full"></span> Đánh Giá Sản Phẩm
            </h2>
            <span class="text-xs text-[#5F716B] font-medium">{{ reviews.length }} đánh giá</span>
          </div>

          <!-- System Comments -->
          <template v-if="commentSettings.comment_type === 'system'">
            <!-- Rating Overview + Filter Row -->
            <div v-if="commentSettings.comment_allow_rating" class="px-6 py-4 bg-[#F8F9F6] border-b border-[#EAECE6] flex items-center gap-4 flex-wrap">
              <div class="flex items-center gap-3">
                <span class="text-4xl font-black text-[#006B57]">{{ avgRating }}</span>
                <div class="flex flex-col">
                  <div class="flex text-amber-400 text-xl">
                    <span v-for="i in 5" :key="i">{{ i <= Math.round(avgRating) ? '★' : '☆' }}</span>
                  </div>
                  <span class="text-xs text-[#5F716B] mt-0.5">Đánh giá tổng thể</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 ml-2">
                <button @click="filterRating = 0"
                  class="px-4 py-2 rounded-full text-xs font-semibold border transition"
                  :class="filterRating === 0 ? 'bg-[#006B57] text-white border-[#006B57]' : 'border-[#DCE6E1] text-[#5F716B] hover:border-[#006B57] hover:text-[#006B57] bg-white'">
                  Tất Cả ({{ reviews.length }})
                </button>
                <button v-for="star in [5,4,3,2,1]" :key="star" @click="filterRating = star"
                  class="px-4 py-2 rounded-full text-xs font-semibold border transition"
                  :class="filterRating === star ? 'bg-[#006B57] text-white border-[#006B57]' : 'border-[#DCE6E1] text-[#5F716B] hover:border-[#006B57] hover:text-[#006B57] bg-white'">
                  {{ star }} Sao ({{ ratingCount(star) }})
                </button>
                <button class="px-4 py-2 rounded-full text-xs font-bold border border-slate-300 text-slate-600 hover:border-orange-400 hover:text-orange-500 transition bg-white flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Có Hình Ảnh / Video ({{ withImageCount }})
                </button>
              </div>
            </div>

          <!-- Review Cards -->
          <div class="divide-y divide-slate-100">
            <div v-if="filteredReviews.length === 0" class="py-16 text-center space-y-3">
              <span class="text-5xl">⭐</span>
              <p class="text-slate-400 font-semibold">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>

            <div v-for="rev in filteredReviews" :key="rev._id" class="px-6 py-5 hover:bg-slate-50/30 transition">
              <div class="flex gap-4">
                <!-- Avatar -->
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-slate-100">
                    <img v-if="rev.user_id?.avatar" :src="rev.user_id.avatar" class="w-full h-full object-cover" />
                    <svg v-else class="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 space-y-2">
                  <!-- Username -->
                  <p class="font-bold text-slate-700 text-sm">{{ maskUsername(rev.user_id?.username) }}</p>

                  <!-- Stars (red) -->
                  <div v-if="commentSettings.comment_allow_rating" class="flex text-red-500 text-base">
                    <span v-for="i in 5" :key="i">{{ i <= rev.rating ? '★' : '☆' }}</span>
                  </div>

                  <!-- Date | Variant | helpful -->
                  <div class="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                    <span>{{ formatReviewDate(rev.createdAt) }}</span>
                    <span class="text-slate-200">|</span>
                    <span>{{ getSkinTypeLabel() }}</span>
                    <span class="text-slate-200">|</span>
                    <span class="text-orange-500 font-semibold">{{ getLikeCount(rev) }} tuyệt</span>
                  </div>

                  <!-- Attribute quick tags -->
                  <div class="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-slate-500">
                    <span><span class="font-semibold text-slate-600">Làm sạch:</span> sạch</span>
                    <span><span class="font-semibold text-slate-600">Dưỡng ẩm:</span> tốt</span>
                    <span><span class="font-semibold text-slate-600">Bọt:</span> mịn</span>
                  </div>

                  <!-- Comment -->
                  <p class="text-slate-600 text-sm leading-relaxed">{{ rev.comment }}</p>

                  <!-- Thumbnails -->
                  <div class="flex gap-2 flex-wrap pt-1">
                    <div v-for="(thumb, ti) in getReviewThumbs(rev)" :key="ti"
                      class="w-[88px] h-[88px] rounded-lg overflow-hidden border-2 border-slate-100 cursor-pointer hover:border-orange-400 transition-all group relative"
                      @click="openLightbox(rev, ti)">
                      <img :src="thumb" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <!-- Hover overlay hint -->
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition drop-shadow" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                      </div>
                    </div>
                  </div>


                  <!-- Actions: Like + Share -->
                  <div class="flex items-center gap-4 pt-1.5">
                    <button @click="toggleLike(rev._id)"
                      class="flex items-center gap-1.5 text-xs font-semibold transition-all"
                      :class="likedReviews.has(rev._id) ? 'text-red-500' : 'text-slate-400 hover:text-red-400'">
                      <svg class="w-4 h-4 transition-transform" :class="likedReviews.has(rev._id) ? 'scale-125' : ''" :fill="likedReviews.has(rev._id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                      </svg>
                      {{ likedReviews.has(rev._id) ? 'Đã thích' : 'Thích' }}
                      <span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono text-[10px] ml-0.5">{{ getLikeCount(rev) }}</span>
                    </button>
                    <button @click="handleShareReview(rev)"
                      class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-500 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/>
                      </svg>
                      Chia sẻ
                    </button>
                  </div>

                  <!-- Shop Reply -->
                  <div v-if="rev.reply" class="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1 mt-1">
                    <p class="font-bold text-emerald-700 flex items-center gap-1">🏪 Phản hồi từ Shop</p>
                    <p class="text-slate-600">{{ rev.reply }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Write Review Form -->
          <div class="px-6 py-6 border-t border-[#EAECE6] bg-[#F8F9F6]">
            <h3 class="font-bold text-[#123C34] text-sm mb-5 flex items-center gap-2">
              <svg class="w-5 h-5 text-[#006B57]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Viết đánh giá của bạn
            </h3>
            <form @submit.prevent="submitReview" class="space-y-4">
              <!-- Star Selector -->
              <div v-if="commentSettings.comment_allow_rating" class="flex items-center gap-3 flex-wrap">
                <span class="text-sm text-slate-500 font-semibold w-24">Chất lượng:</span>
                <div class="flex gap-0.5">
                  <button v-for="star in 5" :key="star" type="button" @click="newRating = star"
                    class="text-2xl transition-transform hover:scale-125"
                    :class="star <= newRating ? 'text-red-500' : 'text-slate-300'">★</button>
                </div>
                <span class="text-xs font-semibold px-3 py-1 rounded-full" :class="newRating >= 4 ? 'bg-red-50 text-red-600' : newRating === 3 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'">
                  {{ newRating === 5 ? '⭐ Xuất sắc' : newRating === 4 ? '😊 Tốt' : newRating === 3 ? '😐 Bình thường' : newRating === 2 ? '😞 Tệ' : '😡 Rất tệ' }}
                </span>
              </div>

              <!-- Text -->
              <textarea v-model="newComment" rows="4"
                placeholder="Chia sẻ trải nghiệm thực tế của bạn (chất lượng, mùi hương, hiệu quả sử dụng...)..."
                class="w-full text-sm p-4 border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl outline-none resize-none transition bg-white">
              </textarea>

              <!-- Image Upload -->
              <div class="space-y-2">
                <span class="text-sm text-slate-500 font-semibold">Thêm hình ảnh (tối đa 5 ảnh):</span>
                <div class="flex gap-2 flex-wrap">
                  <div v-for="(img, idx) in newReviewImages" :key="idx"
                    class="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 group">
                    <img :src="img" class="w-full h-full object-cover" />
                    <button type="button" @click="removeNewImage(idx)"
                      class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">✕</button>
                  </div>
                  <label v-if="newReviewImages.length < 5"
                    class="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition">
                    <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    <span class="text-[10px] text-slate-400 mt-1">Thêm ảnh</span>
                    <input type="file" accept="image/*" multiple class="hidden" @change="handleReviewImageUpload" />
                  </label>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <button type="submit" :disabled="submittingReview"
                  class="px-8 bg-[#006B57] hover:bg-[#005544] text-white font-bold py-3 rounded-xl text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2">
                  <svg v-if="submittingReview" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  {{ submittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá' }}
                </button>
                <p class="text-xs text-slate-400">Đánh giá của bạn sẽ giúp ích cho nhiều người khác 💚</p>
              </div>
            </form>
          </div>
          </template>

          <!-- Facebook Comments -->
          <template v-if="commentSettings.comment_type === 'facebook'">
            <div class="px-6 py-6">
              <div class="fb-comments" data-href="https://testskin.example.com" data-width="100%" data-numposts="5"></div>
            </div>
          </template>
        </div>

        <!-- Similar Products -->
        <section v-if="similarProducts.length > 0" class="bg-white rounded-2xl shadow-sm p-6 space-y-5 border border-[#EAECE6]">
          <div class="flex items-center gap-3">
            <span class="w-1 h-6 bg-[#006B57] rounded-full"></span>
            <h3 class="text-sm font-bold text-[#123C34]">Sản Phẩm Tương Tự</h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <ProductCard v-for="sim in similarProducts" :key="sim._id" :product="sim" />
          </div>
        </section>
      </template>
    </main>

    <Footer />
  </div>

  <!-- ===== LIGHTBOX MODAL ===== -->
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="lightbox.open"
        class="fixed inset-0 z-[9999] flex items-center justify-center"
        @click.self="closeLightbox">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="closeLightbox"></div>

        <!-- Modal Content -->
        <div class="relative z-10 flex flex-col items-center max-w-4xl w-full mx-4">
          <!-- Close button -->
          <button @click="closeLightbox"
            class="absolute -top-12 right-0 text-white/70 hover:text-white transition text-4xl leading-none font-light z-20">
            ×
          </button>

          <!-- Image Counter -->
          <div class="absolute -top-10 left-0 text-white/60 text-sm font-semibold">
            {{ lightbox.index + 1 }} / {{ lightbox.images.length }}
          </div>

          <!-- Main Image -->
          <div class="relative w-full flex items-center justify-center">
            <!-- Prev Arrow -->
            <button v-if="lightbox.images.length > 1"
              @click="prevLightboxImage"
              class="absolute left-0 z-20 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur rounded-full flex items-center justify-center text-white transition -ml-6 shadow-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
              </svg>
            </button>

            <!-- Image -->
            <div class="max-h-[80vh] max-w-full overflow-hidden rounded-2xl shadow-2xl">
              <img
                :src="lightbox.images[lightbox.index]"
                :key="lightbox.index"
                class="max-h-[80vh] max-w-full object-contain block"
                style="min-width: 280px;"
              />
            </div>

            <!-- Next Arrow -->
            <button v-if="lightbox.images.length > 1"
              @click="nextLightboxImage"
              class="absolute right-0 z-20 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur rounded-full flex items-center justify-center text-white transition -mr-6 shadow-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </button>
          </div>

          <!-- Dot Indicators -->
          <div v-if="lightbox.images.length > 1" class="flex gap-2 mt-5">
            <button
              v-for="(img, di) in lightbox.images"
              :key="di"
              @click="lightbox.index = di"
              class="w-2.5 h-2.5 rounded-full transition"
              :class="di === lightbox.index ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'"
            ></button>
          </div>

          <!-- Thumbnail strip -->
          <div v-if="lightbox.images.length > 1" class="flex gap-2 mt-3">
            <button
              v-for="(img, ti) in lightbox.images"
              :key="ti"
              @click="lightbox.index = ti"
              class="w-14 h-14 rounded-lg overflow-hidden border-2 transition flex-shrink-0"
              :class="ti === lightbox.index ? 'border-orange-400 opacity-100' : 'border-white/20 opacity-50 hover:opacity-80'"
            >
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

</template>

<style scoped>
/* ===== Lightbox Transition ===== */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.25s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.lightbox-enter-active .relative,
.lightbox-leave-active .relative {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.lightbox-enter-from .relative {
  transform: scale(0.92);
  opacity: 0;
}
.lightbox-leave-to .relative {
  transform: scale(0.92);
  opacity: 0;
}

/* ===== Product Image Fade (variant switch) ===== */
.img-fade-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.img-fade-leave-active {
  transition: opacity 0.15s ease;
}
.img-fade-enter-from {
  opacity: 0;
  transform: scale(0.97);
}
.img-fade-leave-to {
  opacity: 0;
}

/* Prevent body scroll when lightbox open */
body:has(.fixed.z-\[9999\]) {
  overflow: hidden;
}
</style>

