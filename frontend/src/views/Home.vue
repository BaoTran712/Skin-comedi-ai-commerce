<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import ProductCard from '../components/ProductCard.vue';
import ProductService from '../services/product.service';

const productService = new ProductService();
const featuredProducts = ref([]);
const activeIngredient = ref('niacinamide');

const ingredients = ref([
  {
    id: 'niacinamide',
    name: 'Niacinamide (Vitamin B3)',
    subtitle: 'Khôi phục hàng rào bảo vệ da',
    desc: 'Niacinamide giúp kích thích sản sinh ceramides tự nhiên của da, củng cố hàng rào bảo vệ da, mờ thâm mụn, se khít lỗ chân lông và kiểm soát lượng dầu thừa tối ưu.',
    benefits: ['Mờ vết thâm, đều màu da', 'Kiểm soát bã nhờn, ngừa mụn', 'Tăng sinh ceramide phục hồi da'],
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400',
    color: 'from-teal-500/10 to-emerald-500/10'
  },
  {
    id: 'panthenol',
    name: 'Panthenol (Pro-Vitamin B5)',
    subtitle: 'Làm dịu & phục hồi hư tổn',
    desc: 'Một thành phần vàng giúp giữ ẩm sâu, thúc đẩy quá trình tái tạo tế bào, nhanh chóng làm dịu các vùng da kích ứng, mẩn đỏ hay bong tróc.',
    benefits: ['Làm dịu kích ứng tức thì', 'Cấp ẩm và phục hồi sâu', 'Cải thiện độ đàn hồi của da'],
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400',
    color: 'from-blue-500/10 to-teal-500/10'
  },
  {
    id: 'glycerin',
    name: 'Glycerin',
    subtitle: 'Hoạt chất siêu cấp nước',
    desc: 'Glycerin là chất hút ẩm kinh điển giúp kéo nước từ môi trường vào sâu các lớp biểu bì, ngăn ngừa tình trạng mất nước xuyên biểu bì, mang lại làn da căng mọng.',
    benefits: ['Ngăn chặn sự mất nước tự nhiên', 'Cải thiện bề mặt da mềm mịn', 'Thân thiện tuyệt đối với da nhạy cảm'],
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=400',
    color: 'from-sky-500/10 to-blue-500/10'
  },
  {
    id: 'hyaluronic',
    name: 'Hyaluronic Acid (HA)',
    subtitle: 'Ngậm nước đa tầng vượt trội',
    desc: 'Với khả năng giữ nước gấp 1000 lần trọng lượng của chính nó, HA cấp ẩm tức thì cho da căng mọng, mịn màng và đẩy lùi các nếp nhăn li ti do thiếu nước.',
    benefits: ['Cấp ẩm đa tầng hiệu quả', 'Giúp da căng bóng, săn chắc', 'Làm đầy nếp nhăn nông'],
    image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca558?auto=format&fit=crop&q=80&w=400',
    color: 'from-teal-500/10 to-cyan-500/10'
  }
]);

const fetchFeaturedProducts = async () => {
  try {
    const response = await productService.getAllProducts();
    // Get first 5 products for display
    featuredProducts.value = response.slice(0, 5);
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  fetchFeaturedProducts();
});
</script>

<template>
  <div class="cet-page">
    <Header />

    <!-- 1. HERO BANNER: Clean Clinical Styling -->
    <section class="cet-hero">
      <div class="cet-hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="space-y-6 text-left">
          <span class="cet-eyebrow">KHUYÊN DÙNG BỞI BÁC SĨ DA LIỄU</span>
          <h1 class="cet-hero-title">
            Khoa Học Đằng Sau <br/>
            <span class="text-teal-600">Làn Da Khỏe Đẹp</span>
          </h1>
          <p class="cet-hero-subtitle">
            Chúng tôi cam kết mang lại các công thức chăm sóc da dịu nhẹ, kết hợp các thành phần được nghiên cứu lâm sàng kỹ lưỡng nhằm bảo vệ làn da của bạn khỏi các tác nhân nhạy cảm hàng ngày.
          </p>
          <div class="flex flex-wrap gap-4 pt-2">
            <RouterLink to="/products" class="cet-btn cet-btn--primary">Khám phá sản phẩm</RouterLink>
            <RouterLink to="/diagnosis" class="cet-btn cet-btn--outline">Chuẩn đoán da AI</RouterLink>
          </div>
        </div>

        <div class="cet-hero-img-wrap">
          <div class="cet-hero-circle bg-teal-50/50"></div>
          <img src="https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=800" class="cet-hero-img" alt="Cosmetic bottles on clean lab setting" />
        </div>
      </div>
    </section>

    <!-- 2. SENSITIVE SKIN DEFENSE: Medical Icons Section -->
    <section class="bg-white py-20 border-y border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span class="text-teal-600 font-extrabold text-xs tracking-widest uppercase">KHOA HỌC CHĂM SÓC DA</span>
          <h2 class="text-3xl font-black text-gray-900 leading-tight">Chống lại 5 dấu hiệu nhạy cảm của da</h2>
          <p class="text-gray-500 text-sm">
            Công thức đặc trị của Testskin giải quyết triệt để các vấn đề nhạy cảm cốt lõi của làn da người Việt Nam.
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          <div class="cet-sign-card">
            <div class="cet-sign-icon bg-teal-50 text-teal-600">💧</div>
            <h4 class="font-bold text-gray-800 text-sm mt-4">Hàng rào bảo vệ yếu</h4>
          </div>
          <div class="cet-sign-card">
            <div class="cet-sign-icon bg-teal-50 text-teal-600">🔥</div>
            <h4 class="font-bold text-gray-800 text-sm mt-4">Kích ứng & Mẩn đỏ</h4>
          </div>
          <div class="cet-sign-card">
            <div class="cet-sign-icon bg-teal-50 text-teal-600">🌵</div>
            <h4 class="font-bold text-gray-800 text-sm mt-4">Khô ráp, bong tróc</h4>
          </div>
          <div class="cet-sign-card">
            <div class="cet-sign-icon bg-teal-50 text-teal-600">⚡</div>
            <h4 class="font-bold text-gray-800 text-sm mt-4">Căng rát khó chịu</h4>
          </div>
          <div class="cet-sign-card">
            <div class="cet-sign-icon bg-teal-50 text-teal-600">🛡️</div>
            <h4 class="font-bold text-gray-800 text-sm mt-4">Dễ bị tổn thương</h4>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. DETAILED INGREDIENT HIGHLIGHTS: Interactive tabs layout like Cetaphil -->
    <section class="py-24 bg-gray-50/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span class="text-teal-600 font-extrabold text-xs tracking-widest uppercase">KHO BÁU TỪ KHOA HỌC</span>
          <h2 class="text-3xl font-black text-gray-900 leading-tight">Thành phần chăm sóc chuyên sâu</h2>
          <p class="text-gray-500 text-sm">
            Bấm chọn để khám phá công dụng tuyệt vời của từng hoạt chất cốt lõi bên trong các dòng sản phẩm của chúng tôi.
          </p>
        </div>

        <!-- Tabs Navigation -->
        <div class="flex flex-wrap justify-center gap-3 mb-12">
          <button v-for="ing in ingredients" :key="ing.id" 
                  @click="activeIngredient = ing.id" 
                  class="cet-tab-btn" 
                  :class="{'cet-tab-btn--active': activeIngredient === ing.id}">
            {{ ing.name }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 md:p-12">
          <div v-for="ing in ingredients" :key="ing.id">
            <div v-if="activeIngredient === ing.id" class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in fade-in duration-300">
              <div class="space-y-6">
                <span class="text-teal-600 font-bold text-xs uppercase tracking-widest">{{ ing.subtitle }}</span>
                <h3 class="text-2xl md:text-3xl font-black text-gray-900">{{ ing.name }}</h3>
                <p class="text-gray-600 leading-relaxed text-sm">
                  {{ ing.desc }}
                </p>
                <div class="space-y-3 pt-2">
                  <div v-for="benefit in ing.benefits" :key="benefit" class="flex items-center gap-3 text-sm font-bold text-gray-800">
                    <span class="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs">✓</span>
                    {{ benefit }}
                  </div>
                </div>
                <div class="pt-4">
                  <RouterLink :to="{ path: '/products', query: { q: ing.name.split(' ')[0] } }" class="cet-btn cet-btn--primary">
                    Xem sản phẩm chứa {{ ing.name.split(' ')[0] }}
                  </RouterLink>
                </div>
              </div>
              <div class="relative rounded-2xl overflow-hidden shadow-md h-80 md:h-[400px]">
                <img :src="ing.image" class="w-full h-full object-cover" :alt="ing.name" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. RECOMMENDED PRODUCTS SECTION -->
    <section class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-end justify-between mb-12 pb-4 border-b border-gray-100">
          <div class="space-y-2">
            <span class="text-teal-600 font-extrabold text-xs tracking-widest uppercase">GỢI Ý CHO BẠN</span>
            <h2 class="text-3xl font-black text-gray-900 leading-tight">Dược mỹ phẩm bán chạy nhất</h2>
          </div>
          <div>
            <RouterLink to="/products" class="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wider flex items-center gap-1 mt-4 md:mt-0">
              Xem toàn bộ sản phẩm
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div v-for="product in featuredProducts" :key="product._id">
            <ProductCard :product="product" />
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.cet-page {
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  color: #334155;
}

/* ─── Hero Section ─── */
.cet-hero {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  padding: 6rem 0;
  overflow: hidden;
}

.cet-eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #0d9488;
  letter-spacing: 0.2em;
}

.cet-hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.cet-hero-subtitle {
  font-size: 1.125rem;
  color: #475569;
  line-height: 1.6;
  max-width: 520px;
}

.cet-hero-img-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cet-hero-circle {
  position: absolute;
  width: 120%;
  height: 120%;
  border-radius: 50%;
  z-index: 1;
}

.cet-hero-img {
  position: relative;
  z-index: 2;
  border-radius: 2rem;
  box-shadow: 0 20px 40px rgba(13,148,136,0.08);
  width: 100%;
  max-width: 500px;
  object-fit: cover;
}

/* ─── Buttons ─── */
.cet-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.9rem 2rem;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}

.cet-btn--primary {
  background: linear-gradient(135deg, #0d9488, #0f766e);
  color: white;
  box-shadow: 0 4px 16px rgba(13,148,136,0.25);
}

.cet-btn--primary:hover {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(13,148,136,0.35);
}

.cet-btn--outline {
  background: white;
  border: 1.5px solid #cbd5e1;
  color: #334155;
}

.cet-btn--outline:hover {
  background: #f8fafc;
  border-color: #0d9488;
  color: #0d9488;
}

/* ─── Sensitive Skin signs ─── */
.cet-sign-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
}

.cet-sign-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  box-shadow: 0 4px 12px rgba(13,148,136,0.06);
}

/* ─── Ingredients Tab buttons ─── */
.cet-tab-btn {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 50px;
  padding: 0.75rem 1.75rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.cet-tab-btn:hover {
  border-color: #0d9488;
  color: #0d9488;
  background: #f0fdf4;
}

.cet-tab-btn--active {
  background: #0d9488;
  border-color: #0d9488;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(13,148,136,0.2);
}
</style>