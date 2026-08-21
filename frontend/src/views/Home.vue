<script setup>
import { ref, onMounted, computed } from 'vue';
import Header from '../components/Header.vue';
import FlashSaleSection from '../components/FlashSaleSection.vue';
import RecommendationSection from '../components/RecommendationSection.vue';
import ProductCard from '../components/ProductCard.vue';
import Footer from '../components/Footer.vue';
import ProductService from '../services/product.service';

const productService = new ProductService();
const allProducts = ref([]);
const loading = ref(true);

const categories = ref([
  { name: "Chăm sóc da mụn", tag: "mụn", icon: "healing", desc: "Giảm sưng viêm & làm dịu" },
  { name: "Da nhạy cảm", tag: "nhạy cảm", icon: "spa", desc: "Phục hồi màng bảo vệ" },
  { name: "Dưỡng ẩm sâu", tag: "khô", icon: "water_drop", desc: "Cấp nước & mềm mịn" },
  { name: "Chống nắng da liễu", tag: "chống nắng", icon: "wb_sunny", desc: "Bảo vệ phổ rộng" },
  { name: "Làm sạch dịu nhẹ", tag: "làm sạch", icon: "soap", desc: "Sạch sâu không khô căng" },
  { name: "Serum & Phục hồi", tag: "serum", icon: "science", desc: "Hoạt chất chuyên sâu" }
]);

const blogArticles = ref([
  { id: 1, title: "Làm sao để loại bỏ mụn trứng cá cứng đầu?", category: "Cẩm nang da liễu", desc: "Tìm hiểu nguyên nhân hình thành mụn và các bước chăm sóc da bị mụn được bác sĩ da liễu khuyên dùng.", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=600", date: "07/08/2026" },
  { id: 2, title: "Hiểu về bệnh chàm (Eczema) & cách phục hồi hàng rào bảo vệ", category: "Bệnh lý da", desc: "Các giải pháp phục hồi độ ẩm sâu và giảm ngứa rát khó chịu tức thì cho người bị viêm da cơ địa.", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=600", date: "06/08/2026" },
  { id: 3, title: "Top 5 thành phần vàng cho da nhạy cảm", category: "Thành phần hoạt chất", desc: "Niacinamide, Panthenol, Hyaluronic Acid... Đâu là thành phần phù hợp nhất với làn da của bạn?", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600", date: "05/08/2026" }
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

// Filtered lists from MongoDB database
const flashSaleProducts = computed(() => {
  return allProducts.value.filter(p => p.flash_sale_price > 0 && p.quantity > 0).slice(0, 10);
});

const recommendedProducts = computed(() => {
  return allProducts.value.slice(0, 5);
});

const acneProducts = computed(() => {
  const match = allProducts.value.filter(p => {
    const searchStr = [
      p.title, p.name, p.category, p.description, p.usage,
      ...(Array.isArray(p.pathology) ? p.pathology : [p.pathology]),
      ...(Array.isArray(p.skin_type) ? p.skin_type : [p.skin_type]),
      ...(Array.isArray(p.skin_type_tags) ? p.skin_type_tags : [p.skin_type_tags]),
      ...(Array.isArray(p.skin_conditions_supported) ? p.skin_conditions_supported : [p.skin_conditions_supported]),
      ...(Array.isArray(p.ingredient_tags) ? p.ingredient_tags : [p.ingredient_tags]),
    ].filter(Boolean).join(' ').toLowerCase();
    return searchStr.includes("mụn") || searchStr.includes("acne") || searchStr.includes("bha") || searchStr.includes("salicylic");
  });
  return match.length > 0 ? match.slice(0, 5) : allProducts.value.slice(0, 5);
});

const sensitiveProducts = computed(() => {
  const match = allProducts.value.filter(p => {
    const searchStr = [
      p.title, p.name, p.category, p.description, p.usage,
      ...(Array.isArray(p.pathology) ? p.pathology : [p.pathology]),
      ...(Array.isArray(p.skin_type) ? p.skin_type : [p.skin_type]),
      ...(Array.isArray(p.skin_type_tags) ? p.skin_type_tags : [p.skin_type_tags]),
      ...(Array.isArray(p.skin_conditions_supported) ? p.skin_conditions_supported : [p.skin_conditions_supported]),
      ...(Array.isArray(p.ingredient_tags) ? p.ingredient_tags : [p.ingredient_tags]),
    ].filter(Boolean).join(' ').toLowerCase();
    return searchStr.includes("nhạy cảm") || searchStr.includes("phục hồi") || searchStr.includes("dịu") || searchStr.includes("b5") || searchStr.includes("ceramide");
  });
  return match.length > 0 ? match.slice(0, 5) : allProducts.value.slice(5, 10);
});

const drySkinProducts = computed(() => {
  const match = allProducts.value.filter(p => {
    const searchStr = [
      p.title, p.name, p.category, p.description, p.usage,
      ...(Array.isArray(p.pathology) ? p.pathology : [p.pathology]),
      ...(Array.isArray(p.skin_type) ? p.skin_type : [p.skin_type]),
      ...(Array.isArray(p.skin_type_tags) ? p.skin_type_tags : [p.skin_type_tags]),
      ...(Array.isArray(p.skin_conditions_supported) ? p.skin_conditions_supported : [p.skin_conditions_supported]),
      ...(Array.isArray(p.ingredient_tags) ? p.ingredient_tags : [p.ingredient_tags]),
    ].filter(Boolean).join(' ').toLowerCase();
    return searchStr.includes("khô") || searchStr.includes("ẩm") || searchStr.includes("hyaluronic") || searchStr.includes("cấp nước");
  });
  return match.length > 0 ? match.slice(0, 5) : allProducts.value.slice(0, 5);
});

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#FAF8F5] font-sans text-[#2A2723]">
    <!-- Header -->
    <Header />

    <!-- Main Editorial Content -->
    <main class="flex-grow space-y-24 pb-24">
      
      <!-- 1. ARTISTIC HERO SECTION -->
      <section class="relative bg-[#F4F1EA] border-b border-[#EBE7DF] overflow-hidden py-16 md:py-24 px-4 md:px-8">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <!-- Hero Text -->
          <div class="lg:col-span-7 space-y-8 text-left">
            <div class="inline-flex items-center gap-2 px-3.5 py-1 bg-[#FAF8F5] border border-[#EBE7DF] rounded-full text-[11px] font-semibold text-[#4A5D4E] uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-[#4A5D4E]"></span>
              <span>Dermatology AI Skincare</span>
            </div>

            <h1 class="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2A2723] font-normal leading-[1.15] tracking-tight">
              CHĂM SÓC DA <br />
              <span class="italic font-serif font-light text-[#4A5D4E]">THEO CÁCH</span> <br />
              THÔNG MINH HƠN
            </h1>

            <p class="text-sm md:text-base text-[#6B6357] font-light max-w-lg leading-relaxed">
              Tích hợp trí tuệ nhân tạo nhận diện chuẩn y khoa và dược mỹ phẩm thuần chay lành tính, giúp phục hồi và bảo vệ làn da của bạn mỗi ngày.
            </p>

            <div class="flex flex-wrap gap-4 pt-2">
              <RouterLink to="/diagnosis" class="px-7 py-3.5 bg-[#4A5D4E] text-[#FAF8F5] hover:bg-[#3E4E42] rounded-full text-xs font-semibold uppercase tracking-widest shadow-md transition duration-300 flex items-center gap-2">
                <span>PHÂN TÍCH DA NGAY (AI)</span>
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </RouterLink>
              <RouterLink to="/products" class="px-7 py-3.5 border border-[#2A2723] text-[#2A2723] hover:bg-[#2A2723] hover:text-[#FAF8F5] rounded-full text-xs font-semibold uppercase tracking-widest transition duration-300">
                KHÁM PHÁ SẢN PHẨM
              </RouterLink>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-6 pt-8 border-t border-[#EBE7DF] text-left max-w-md">
              <div>
                <span class="font-serif text-2xl md:text-3xl text-[#2A2723] font-normal block">98.4%</span>
                <span class="text-[11px] text-[#8C8275] uppercase tracking-wider block mt-1">Độ chính xác AI</span>
              </div>
              <div>
                <span class="font-serif text-2xl md:text-3xl text-[#2A2723] font-normal block">100%</span>
                <span class="text-[11px] text-[#8C8275] uppercase tracking-wider block mt-1">Dược phẩm thật</span>
              </div>
              <div>
                <span class="font-serif text-2xl md:text-3xl text-[#2A2723] font-normal block">24/7</span>
                <span class="text-[11px] text-[#8C8275] uppercase tracking-wider block mt-1">Dược sĩ tư vấn</span>
              </div>
            </div>
          </div>

          <!-- Hero Still-Life Image -->
          <div class="lg:col-span-5 relative">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-[#EBE7DF] aspect-[4/5] bg-white">
              <img 
                src="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=800" 
                alt="Artistic Skincare Product Still Life" 
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#2A2723]/40 via-transparent to-transparent"></div>
              
              <!-- Floating Badge -->
              <div class="absolute bottom-6 left-6 right-6 bg-[#FAF8F5]/90 backdrop-blur-md p-4 rounded-2xl border border-[#EBE7DF] text-left">
                <p class="text-[10px] text-[#4A5D4E] uppercase tracking-widest font-bold">Giải pháp y khoa hàng đầu</p>
                <p class="font-serif text-base text-[#2A2723] font-medium mt-0.5">Phục hồi hàng rào bảo vệ da tự nhiên</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- 2. AI SKIN ANALYSIS SECTION ("Hiểu làn da của bạn") -->
      <section class="max-w-7xl mx-auto px-4 md:px-8">
        <div class="bg-gradient-to-br from-[#FAFDFB] to-[#E8F7EF]/40 rounded-[32px] p-8 md:p-14 border border-[#E1ECE7] shadow-xl text-left relative overflow-hidden">
          <!-- Decorative Background Elements -->
          <div class="absolute -top-40 -right-40 w-96 h-96 bg-[#E8F7EF]/30 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-[#008F6B]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <!-- Left content -->
            <div class="lg:col-span-5 space-y-6">
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-[#E8F7EF] border border-[#008F6B]/20 rounded-full text-xs font-semibold text-[#005B4F] uppercase tracking-wider">
                <span class="material-symbols-outlined text-sm">psychology</span>
                <span>CÔNG NGHỆ AI DA LIỄU</span>
              </div>
              <h2 class="font-serif text-3xl md:text-4xl text-[#123F38] font-bold leading-tight">
                Hiểu Làn Da Của Bạn <br />
                <span class="italic text-[#008F6B] font-serif font-light">Chỉ Sau 5 Giây</span>
              </h2>
              <p class="text-sm text-[#6F7F7A] font-medium leading-relaxed">
                AI hỗ trợ phân tích hình ảnh vùng da, nhận diện dấu hiệu bất thường như mụn, chàm, vảy nến và đưa ra gợi ý phác đồ chăm sóc cá nhân hóa chuẩn y khoa.
              </p>
              <RouterLink to="/diagnosis" class="inline-flex items-center gap-2.5 px-8 py-4 bg-[#005B4F] hover:bg-[#003F38] text-white rounded-full text-xs font-extrabold uppercase tracking-widest shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-0.5">
                <span>PHÂN TÍCH DA NGAY</span>
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </RouterLink>
            </div>
            
            <!-- Right cards -->
            <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <!-- Card 01 -->
              <div class="bg-white border border-[#E1ECE7] p-6 rounded-[24px] space-y-4 hover:border-[#008F6B] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group shadow-xs">
                <div class="flex justify-between items-start">
                  <span class="font-serif text-4xl font-extrabold text-[#008F6B]/20 group-hover:text-[#008F6B] transition-colors">01</span>
                  <div class="w-8 h-8 rounded-full bg-[#E8F7EF] flex items-center justify-center text-[#005B4F]">
                    <span class="material-symbols-outlined text-base">photo_camera</span>
                  </div>
                </div>
                <div class="space-y-1 text-left">
                  <h3 class="font-bold text-sm text-[#123F38] uppercase tracking-wider">Tải Ảnh Da</h3>
                  <p class="text-xs text-[#6F7F7A] font-medium leading-relaxed">Chụp hoặc chọn hình ảnh vùng da cần kiểm tra.</p>
                </div>
              </div>
              
              <!-- Card 02 -->
              <div class="bg-white border border-[#E1ECE7] p-6 rounded-[24px] space-y-4 hover:border-[#008F6B] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group shadow-xs">
                <div class="flex justify-between items-start">
                  <span class="font-serif text-4xl font-extrabold text-[#008F6B]/20 group-hover:text-[#008F6B] transition-colors">02</span>
                  <div class="w-8 h-8 rounded-full bg-[#E8F7EF] flex items-center justify-center text-[#005B4F]">
                    <span class="material-symbols-outlined text-base">analytics</span>
                  </div>
                </div>
                <div class="space-y-1 text-left">
                  <h3 class="font-bold text-sm text-[#123F38] uppercase tracking-wider">AI Phân Tích</h3>
                  <p class="text-xs text-[#6F7F7A] font-medium leading-relaxed">AI phân tích hình ảnh và đưa ra kết quả sơ bộ.</p>
                </div>
              </div>
              
              <!-- Card 03 -->
              <div class="bg-white border border-[#E1ECE7] p-6 rounded-[24px] space-y-4 hover:border-[#008F6B] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group shadow-xs">
                <div class="flex justify-between items-start">
                  <span class="font-serif text-4xl font-extrabold text-[#008F6B]/20 group-hover:text-[#008F6B] transition-colors">03</span>
                  <div class="w-8 h-8 rounded-full bg-[#E8F7EF] flex items-center justify-center text-[#005B4F]">
                    <span class="material-symbols-outlined text-base">spa</span>
                  </div>
                </div>
                <div class="space-y-1 text-left">
                  <h3 class="font-bold text-sm text-[#123F38] uppercase tracking-wider">Gợi Ý Chuẩn</h3>
                  <p class="text-xs text-[#6F7F7A] font-medium leading-relaxed">Đề xuất hướng chăm sóc và sản phẩm phù hợp.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. CATEGORY SECTION ("Khám phá theo nhu cầu") -->
      <section class="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div class="text-center max-w-xl mx-auto space-y-2">
          <span class="text-xs text-[#4A5D4E] font-semibold uppercase tracking-widest">Danh Mục Chuyên Sâu</span>
          <h2 class="font-serif text-3xl md:text-4xl text-[#2A2723] font-normal">Khám Phá Theo Nhu Cầu</h2>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          <RouterLink 
            v-for="(cat, idx) in categories" 
            :key="idx"
            :to="`/products?q=${encodeURIComponent(cat.tag)}`"
            class="bg-white border border-[#EBE7DF] rounded-2xl p-5 text-center hover:border-[#4A5D4E] hover:shadow-md transition-all duration-300 group flex flex-col items-center justify-between h-44"
          >
            <div class="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EBE7DF] flex items-center justify-center text-[#4A5D4E] group-hover:bg-[#4A5D4E] group-hover:text-white transition duration-300">
              <span class="material-symbols-outlined text-xl">{{ cat.icon }}</span>
            </div>
            
            <div class="space-y-1">
              <h3 class="font-serif text-sm font-medium text-[#2A2723] group-hover:text-[#4A5D4E] transition-colors">{{ cat.name }}</h3>
              <p class="text-[10px] text-[#8C8275] font-light leading-tight">{{ cat.desc }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- 4. FLASH SALE (if active) -->
      <section v-if="flashSaleProducts.length > 0" class="max-w-7xl mx-auto px-4 md:px-8">
        <FlashSaleSection :products="flashSaleProducts" />
      </section>

      <!-- 5. AI RECOMMENDED PRODUCTS SECTION -->
      <section class="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#EBE7DF] pb-4 gap-4">
          <div class="text-left space-y-1">
            <span class="text-xs text-[#9A5B32] font-semibold uppercase tracking-widest">Cá Nhân Hóa Da Liễu</span>
            <h2 class="font-serif text-2xl md:text-3xl text-[#2A2723] font-normal">Gợi Ý Dành Cho Làn Da Của Bạn</h2>
          </div>
          <RouterLink to="/products" class="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E] hover:underline">
            Xem tất cả sản phẩm →
          </RouterLink>
        </div>

        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div v-for="n in 5" :key="n" class="h-80 bg-[#EBE7DF]/50 rounded-2xl animate-pulse"></div>
        </div>

        <div v-else>
          <RecommendationSection :products="recommendedProducts" />
        </div>
      </section>

      <!-- 6. BEST SELLING PRODUCTS GRID BY SKIN CONCERNS -->
      <section class="max-w-7xl mx-auto px-4 md:px-8 space-y-16">
        
        <!-- Section A: Acne Treatment -->
        <div class="space-y-8">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#EBE7DF] pb-4 gap-4">
            <div class="text-left space-y-1">
              <span class="text-xs text-[#4A5D4E] font-semibold uppercase tracking-widest">Chuyên Da Mụn & Dầu</span>
              <h2 class="font-serif text-2xl md:text-3xl text-[#2A2723] font-normal">Hỗ Trợ Điều Trị Mụn Da Liễu</h2>
            </div>
            <RouterLink to="/products?q=mụn" class="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E] hover:underline">
              Khám phá thêm →
            </RouterLink>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <ProductCard v-for="product in acneProducts" :key="product._id" :product="product" />
            <div v-if="acneProducts.length === 0" class="col-span-full py-12 text-center text-[#8C8275] text-xs font-serif italic">
              Chưa có sản phẩm trị mụn nào trong cơ sở dữ liệu.
            </div>
          </div>
        </div>

        <!-- Section B: Sensitive Skin -->
        <div class="space-y-8">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#EBE7DF] pb-4 gap-4">
            <div class="text-left space-y-1">
              <span class="text-xs text-[#4A5D4E] font-semibold uppercase tracking-widest">Phục Hồi Sâu</span>
              <h2 class="font-serif text-2xl md:text-3xl text-[#2A2723] font-normal">Dành Cho Làn Da Nhạy Cảm</h2>
            </div>
            <RouterLink to="/products?q=nhạy+cảm" class="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E] hover:underline">
              Khám phá thêm →
            </RouterLink>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <ProductCard v-for="product in sensitiveProducts" :key="product._id" :product="product" />
            <div v-if="sensitiveProducts.length === 0" class="col-span-full py-12 text-center text-[#8C8275] text-xs font-serif italic">
              Chưa có sản phẩm cho da nhạy cảm nào trong cơ sở dữ liệu.
            </div>
          </div>
        </div>

      </section>

      <!-- 7. BRAND STORY SECTION (50/50 Editorial Layout) -->
      <section class="max-w-7xl mx-auto px-4 md:px-8">
        <div class="bg-[#F4F1EA] border border-[#EBE7DF] rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 text-left">
          
          <div class="p-8 md:p-14 flex flex-col justify-center space-y-6">
            <span class="text-xs text-[#4A5D4E] font-semibold uppercase tracking-widest">Triết Lý Thương Hiệu</span>
            <h2 class="font-serif text-3xl md:text-4xl text-[#2A2723] font-normal leading-tight">
              Sự Kết Hợp Giữa Dược Liệu Tự Nhiên & Y Khoa Hiện Đại
            </h2>
            <p class="text-xs md:text-sm text-[#6B6357] font-light leading-relaxed">
              Mỗi công thức chăm sóc da tại SkinMedi AI đều được kiểm nghiệm lâm sàng bởi các chuyên gia da liễu hàng đầu. Chúng tôi cam kết minh bạch thành phần, không chứa chất gây kích ứng và ứng dụng AI để đồng hành cùng lộ trình phục hồi làn da của bạn.
            </p>
            <div>
              <RouterLink to="/products" class="inline-block px-7 py-3 border border-[#2A2723] text-[#2A2723] hover:bg-[#2A2723] hover:text-white rounded-full text-xs font-semibold uppercase tracking-widest transition duration-300">
                TÌM HIỂU THÊM
              </RouterLink>
            </div>
          </div>

          <div class="relative min-h-[320px] lg:min-h-full">
            <img 
              src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800" 
              alt="Brand Skincare Ingredients Story" 
              class="w-full h-full object-cover"
            />
          </div>

        </div>
      </section>

      <!-- 8. KNOWLEDGE BLOG SECTION -->
      <section class="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div class="text-left border-b border-[#EBE7DF] pb-4">
          <span class="text-xs text-[#4A5D4E] font-semibold uppercase tracking-widest">Cẩm Nang Bác Sĩ</span>
          <h2 class="font-serif text-2xl md:text-3xl text-[#2A2723] font-normal mt-1">Kiến Thức Chăm Sóc Da</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <article 
            v-for="blog in blogArticles" 
            :key="blog.id"
            class="bg-white rounded-2xl border border-[#EBE7DF] overflow-hidden hover:shadow-lg transition duration-500 flex flex-col h-full group"
          >
            <div class="h-52 w-full overflow-hidden bg-[#F4F1EA] relative">
              <img :src="blog.image" :alt="blog.title" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              <span class="absolute top-3 left-3 bg-[#4A5D4E] text-[#FAF8F5] font-semibold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow">
                {{ blog.category }}
              </span>
            </div>

            <div class="p-6 flex flex-col flex-grow justify-between space-y-4">
              <div>
                <span class="text-[10px] text-[#8C8275] font-medium block mb-1 uppercase tracking-wider">{{ blog.date }}</span>
                <h3 class="font-serif text-base text-[#2A2723] font-medium line-clamp-2 group-hover:text-[#4A5D4E] transition-colors leading-snug">
                  {{ blog.title }}
                </h3>
                <p class="text-xs text-[#6B6357] font-light mt-2 line-clamp-3 leading-relaxed">
                  {{ blog.desc }}
                </p>
              </div>

              <div class="pt-3 border-t border-[#FAF8F5] text-xs font-semibold text-[#4A5D4E] flex items-center gap-1">
                <span>Đọc bài viết</span>
                <span>→</span>
              </div>
            </div>
          </article>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<style scoped>
</style>