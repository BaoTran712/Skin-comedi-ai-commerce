<script setup>
import { ref, onMounted, computed } from 'vue';
import Header from '../components/Header.vue';
import CategoryMenu from '../components/CategoryMenu.vue';
import HeroCarousel from '../components/HeroCarousel.vue';
import QuickServiceCard from '../components/QuickServiceCard.vue';
import FlashSaleSection from '../components/FlashSaleSection.vue';
import AIDiagnosisBanner from '../components/AIDiagnosisBanner.vue';
import RecommendationSection from '../components/RecommendationSection.vue';
import ProductCard from '../components/ProductCard.vue';
import Footer from '../components/Footer.vue';
import ProductService from '../services/product.service';

const productService = new ProductService();
const allProducts = ref([]);
const loading = ref(true);

const quickServices = ref([
  { 
    title: "Chẩn Đoán Da AI", 
    desc: "Quét và phát hiện bệnh da nhanh chóng", 
    to: "/diagnosis", 
    gradient: "from-emerald-500/10 to-teal-600/10 hover:bg-emerald-50", 
    iconSvg: `<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l-1.813-5.096L2.096 15 7.192 13.187 9 8.096l1.813 5.091L15.904 15l-5.091 1.813zM21 15h-3m3 3h-3m3-6h-3M9 3H6m3 3H6m3-6H6"/></svg>` 
  },
  { 
    title: "Mua Thuốc Kê Đơn", 
    desc: "Chụp toa thuốc, dược sĩ giao ngay", 
    to: "/products", 
    gradient: "from-teal-500/10 to-emerald-600/10 hover:bg-teal-50", 
    iconSvg: `<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v8m-4-4h8m1 9a9 9 0 110-18 9 9 0 010 18z"/></svg>` 
  },
  { 
    title: "Tư Vấn Bác Sĩ", 
    desc: "Trò chuyện trực tuyến với bác sĩ chuyên khoa", 
    to: "/contacts", 
    gradient: "from-emerald-500/10 to-emerald-600/10 hover:bg-emerald-50", 
    iconSvg: `<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>` 
  },
  { 
    title: "Tìm Cửa Hàng", 
    desc: "Hệ thống nhà thuốc gần bạn nhất", 
    to: "/userprofile", 
    gradient: "from-rose-500/10 to-rose-600/10 hover:bg-rose-50", 
    iconSvg: `<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` 
  },
  { 
    title: "Đơn Hàng Của Tôi", 
    desc: "Theo dõi tình trạng đơn mua", 
    to: "/ordercheck", 
    gradient: "from-amber-500/10 to-amber-600/10 hover:bg-amber-50", 
    iconSvg: `<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>` 
  },
  { 
    title: "100% Chính Hãng", 
    desc: "Cam kết hoàn tiền 200% nếu giả", 
    to: "/products", 
    gradient: "from-cyan-500/10 to-cyan-600/10 hover:bg-cyan-50", 
    iconSvg: `<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>` 
  }
]);

const blogArticles = ref([
  { id: 1, title: "Làm sao để loại bỏ mụn trứng cá cứng đầu?", category: "Mẹo chăm sóc da", desc: "Tìm hiểu nguyên nhân hình thành mụn và các bước chăm sóc da bị mụn được bác sĩ da liễu khuyên dùng.", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400", date: "07/07/2026" },
  { id: 2, title: "Hiểu về bệnh chàm (Eczema) và cách phục hồi hàng rào bảo vệ", category: "Bệnh lý da liễu", desc: "Các giải pháp phục hồi độ ẩm sâu và giảm ngứa rát khó chịu tức thì cho người bị viêm da cơ địa.", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400", date: "06/07/2026" },
  { id: 3, title: "Top 5 thành phần vàng cho da nhạy cảm", category: "Đánh giá sản phẩm", desc: "Niacinamide, Panthenol, Hyaluronic Acid... Đâu là thành phần phù hợp nhất với làn da của bạn?", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400", date: "05/07/2026" }
]);

const fetchProducts = async () => {
  try {
    const data = await productService.getAllProducts();
    allProducts.value = data;
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
  } finally {
    loading.value = false;
  }
};

// Filtered lists
const flashSaleProducts = computed(() => {
  return allProducts.value.filter(p => p.flash_sale_price > 0 && p.quantity > 0).slice(0, 10);
});

const recommendedProducts = computed(() => {
  return allProducts.value.slice(0, 5);
});

const acneProducts = computed(() => {
  return allProducts.value.filter(p => p.pathology?.includes("mụn")).slice(0, 5);
});

const sensitiveProducts = computed(() => {
  return allProducts.value.filter(p => p.skin_type?.includes("da nhạy cảm")).slice(0, 5);
});

const drySkinProducts = computed(() => {
  return allProducts.value.filter(p => p.skin_type?.includes("da khô")).slice(0, 5);
});

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <!-- Header components -->
    <Header />
    <CategoryMenu />

    <!-- Main Content Area -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-12 md:space-y-16">
      
      <!-- 1. Hero Carousel -->
      <HeroCarousel />

      <!-- 2. Quick Services Shortcuts -->
      <section class="space-y-6">
        <div class="text-left">
          <span class="text-emerald-600 font-extrabold text-[10px] tracking-widest uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            Dịch vụ tiện ích
          </span>
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 mt-2">
            Trải nghiệm dịch vụ y khoa hiện đại
          </h2>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div v-for="(service, idx) in quickServices" :key="idx">
            <QuickServiceCard 
              :title="service.title"
              :icon="service.icon"
              :desc="service.desc"
              :to="service.to"
              :gradient="service.gradient"
              :iconColor="service.iconColor"
            />
          </div>
        </div>
      </section>

      <!-- 3. Flash Sale Section (if active flash sale items exist) -->
      <section v-if="flashSaleProducts.length > 0">
        <FlashSaleSection :products="flashSaleProducts" />
      </section>

      <!-- 4. AI Skin Diagnosis Highlight Banner (Biggest Highlight) -->
      <section>
        <AIDiagnosisBanner />
      </section>

      <!-- 5. AI Recommended Products Section -->
      <section>
        <RecommendationSection :products="recommendedProducts" />
      </section>

      <!-- 6. Best Sellers & Skincare Categories -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Main Products Side -->
        <div class="lg:col-span-12 space-y-12">
          
          <!-- Products for Acne -->
          <div class="space-y-6">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span class="material-symbols-outlined text-black">healing</span> Hỗ Trợ Trị Mụn Da Liễu
              </h3>
              <RouterLink to="/products?q=mụn" class="text-xs font-bold text-emerald-600 hover:underline">
                Xem tất cả
              </RouterLink>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <ProductCard v-for="product in acneProducts" :key="product._id" :product="product" />
              <div v-if="acneProducts.length === 0" class="col-span-full py-8 text-center text-slate-400 text-xs">
                Chưa có sản phẩm điều trị mụn nào trong cơ sở dữ liệu.
              </div>
            </div>
          </div>

          <!-- Products for Sensitive Skin -->
          <div class="space-y-6">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span class="material-symbols-outlined text-black">spa</span> Phục Hồi Làn Da Nhạy Cảm
              </h3>
              <RouterLink to="/products?q=nhạy+cảm" class="text-xs font-bold text-emerald-600 hover:underline">
                Xem tất cả
              </RouterLink>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <ProductCard v-for="product in sensitiveProducts" :key="product._id" :product="product" />
              <div v-if="sensitiveProducts.length === 0" class="col-span-full py-8 text-center text-slate-400 text-xs">
                Chưa có sản phẩm cho da nhạy cảm nào trong cơ sở dữ liệu.
              </div>
            </div>
          </div>

          <!-- Products for Dry Skin -->
          <div class="space-y-6">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span class="material-symbols-outlined text-black">water_drop</span> Cấp Ẩm Da Khô & Bong Tróc
              </h3>
              <RouterLink to="/products?q=khô" class="text-xs font-bold text-emerald-600 hover:underline">
                Xem tất cả
              </RouterLink>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <ProductCard v-for="product in drySkinProducts" :key="product._id" :product="product" />
              <div v-if="drySkinProducts.length === 0" class="col-span-full py-8 text-center text-slate-400 text-xs">
                Chưa có sản phẩm cấp ẩm da khô nào trong cơ sở dữ liệu.
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- 7. Health Skin Blogs Section -->
      <section class="space-y-6">
        <div class="text-left">
          <span class="text-emerald-600 font-extrabold text-[10px] tracking-widest uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            Cẩm nang y khoa
          </span>
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 mt-2">
            Bài viết nổi bật từ bác sĩ da liễu
          </h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article 
            v-for="blog in blogArticles" 
            :key="blog.id"
            class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition duration-300 flex flex-col h-full group"
          >
            <div class="h-48 w-full overflow-hidden bg-slate-100 relative">
              <img :src="blog.image" :alt="blog.title" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <span class="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-md shadow">
                {{ blog.category }}
              </span>
            </div>
            
            <div class="p-5 flex flex-col flex-grow text-left justify-between">
              <div>
                <span class="text-[10px] text-slate-400 font-bold block mb-1">Đăng ngày: {{ blog.date }}</span>
                <h3 class="font-extrabold text-slate-800 text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                  {{ blog.title }}
                </h3>
                <p class="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {{ blog.desc }}
                </p>
              </div>
              
              <div class="pt-4 border-t border-slate-50 mt-4 flex items-center text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                <span>Đọc bài viết</span>
                <span class="ml-1">→</span>
              </div>
            </div>
          </article>
        </div>
      </section>

    </main>

    <!-- Footer component -->
    <Footer />
  </div>
</template>

<style scoped>
</style>