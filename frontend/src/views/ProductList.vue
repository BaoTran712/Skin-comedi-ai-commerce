<script setup>
import ProductCard from "../components/ProductCard.vue";
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import InputSearch from "../components/InputSearch.vue";
import AdminLayout from "../components/AdminLayout.vue";

import { useRouter, useRoute } from "vue-router";
import { ref, computed, onMounted, watch } from 'vue';
import ProductService from '../services/product.service';
import BrandService from '../services/brand.service';
import { push } from "notivue";

const router = useRouter();
const route = useRoute();
const productService = new ProductService();
const brandService = new BrandService();
const role = computed(() => (localStorage.getItem("role") || "").toUpperCase());

// ── ADMIN state ───────────────────────────────────────────────
const products = ref([]);
const searchText = ref("");
const selectedSkinType = ref("");
const selectedPathology = ref("");
const skinTypes = ["da dầu", "da khô", "da nhạy cảm", "da hỗn hợp", "mọi loại da"];
const pathologies = ["mụn", "nám", "tàn nhang", "lão hóa", "mẩn đỏ", "khô da"];

// ── CUSTOMER state ────────────────────────────────────────────
const allProducts = ref([]);
const brands = ref([]);
const loading = ref(true);
const apiError = ref(false);

// Sidebar filters
const categoryKeyword = ref("");
const selectedBrands = ref([]);
const selectedPriceRange = ref("");
const selectedSkinTypes = ref([]);
const selectedPathologies = ref([]);
const selectedRating = ref(0);
const sortBy = ref("relevant");
const searchQuery = ref("");
const showMoreBrands = ref(false);

// Mobile filter drawer
const showFilterDrawer = ref(false);

// Pagination
const currentPage = ref(1);
const itemsPerPage = 12;

// Recently viewed
const recentlyViewed = ref([]);

// Categories for sidebar (static + from query)
const sidebarCategories = [
  { label: "Tất cả sản phẩm", keyword: "" },
  { label: "Sữa rửa mặt", keyword: "sữa rửa mặt" },
  { label: "Toner", keyword: "toner" },
  { label: "Serum", keyword: "serum" },
  { label: "Kem dưỡng", keyword: "kem dưỡng" },
  { label: "Kem chống nắng", keyword: "chống nắng" },
  { label: "Tẩy tế bào chết", keyword: "tẩy tế bào chết" },
  { label: "Điều trị da mụn", keyword: "mụn" },
  { label: "Da nhạy cảm", keyword: "nhạy cảm" },
  { label: "Da khô", keyword: "da khô" },
  { label: "Da dầu", keyword: "da dầu" },
  { label: "Mặt nạ", keyword: "mặt nạ" },
  { label: "Vitamins & Thực phẩm chức năng", keyword: "vitamin" },
];

const priceRanges = [
  { label: "Dưới 200.000 ₫", value: "0-200000" },
  { label: "200.000 – 500.000 ₫", value: "200000-500000" },
  { label: "500.000 – 1.000.000 ₫", value: "500000-1000000" },
  { label: "1.000.000 – 2.000.000 ₫", value: "1000000-2000000" },
  { label: "Trên 2.000.000 ₫", value: "2000000-999999999" },
];

const skinTypeOptions = ["Da dầu", "Da khô", "Da hỗn hợp", "Da nhạy cảm", "Da thường"];
const pathologyOptions = ["Mụn", "Thâm", "Nám", "Khô da", "Da kích ứng", "Lão hóa", "Dầu nhờn", "Lỗ chân lông"];
const ratingOptions = [
  { label: "5 sao", min: 5 },
  { label: "Từ 4 sao trở lên", min: 4 },
  { label: "Từ 3 sao trở lên", min: 3 },
  { label: "Từ 2 sao trở lên", min: 2 },
];

const sortOptions = [
  { value: "relevant", label: "Liên quan nhất" },
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
  { value: "newest", label: "Mới nhất" },
  { value: "sold", label: "Bán chạy" },
  { value: "rating", label: "Đánh giá cao" },
];

// ── DATA FETCH ────────────────────────────────────────────────
const fetchData = async () => {
  loading.value = true;
  apiError.value = false;
  try {
    const [prodRes, brandRes] = await Promise.all([
      productService.getAllProducts(),
      brandService.getAllBrands(),
    ]);
    allProducts.value = Array.isArray(prodRes) ? prodRes : [];
    brands.value = Array.isArray(brandRes) ? brandRes : [];
  } catch (e) {
    console.error(e);
    apiError.value = true;
  } finally {
    loading.value = false;
  }
};

// ── RECENTLY VIEWED ───────────────────────────────────────────
const loadRecentlyViewed = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    recentlyViewed.value = stored.slice(0, 5);
  } catch {
    recentlyViewed.value = [];
  }
};

// ── COMPUTED avg rating per product ──────────────────────────
const productAvgRating = computed(() => {
  const map = {};
  allProducts.value.forEach(p => {
    if (p.reviews && p.reviews.length) {
      const avg = p.reviews.reduce((s, r) => s + (r.rating || 0), 0) / p.reviews.length;
      map[p._id] = avg;
    } else {
      map[p._id] = p.avgRating || 0;
    }
  });
  return map;
});

// ── VISIBLE BRANDS (top 6 + show more) ───────────────────────
const visibleBrands = computed(() => {
  return showMoreBrands.value ? brands.value : brands.value.slice(0, 6);
});

// ── FILTERED & SORTED PRODUCTS ───────────────────────────────
const filteredProducts = computed(() => {
  let result = [...allProducts.value];

  // 1. Search
  if (searchQuery.value.trim()) {
    const kw = searchQuery.value.toLowerCase();
    result = result.filter(p => {
      const text = [
        p.title, p.name, p.usage, p.category, p.description,
        p.brand_id?.name,
        ...(Array.isArray(p.skin_type) ? p.skin_type : [p.skin_type]),
        ...(Array.isArray(p.skin_type_tags) ? p.skin_type_tags : [p.skin_type_tags]),
        ...(Array.isArray(p.pathology) ? p.pathology : [p.pathology]),
      ].filter(Boolean).join(' ').toLowerCase();
      return text.includes(kw);
    });
  }

  // 2. Category keyword
  if (categoryKeyword.value) {
    const kw = categoryKeyword.value.toLowerCase();
    result = result.filter(p => {
      const text = [
        p.title, p.name, p.category, p.description, p.usage,
        p.brand_id?.name,
        ...(Array.isArray(p.skin_type) ? p.skin_type : []),
        ...(Array.isArray(p.pathology) ? p.pathology : []),
      ].filter(Boolean).join(' ').toLowerCase();
      return text.includes(kw);
    });
  }

  // 3. Brands
  if (selectedBrands.value.length > 0) {
    result = result.filter(p =>
      selectedBrands.value.includes(p.brand_id?._id || p.brand_id)
    );
  }

  // 4. Price range
  if (selectedPriceRange.value) {
    const [min, max] = selectedPriceRange.value.split('-').map(Number);
    result = result.filter(p => {
      const price = p.flash_sale_price || p.price || 0;
      return price >= min && price <= max;
    });
  }

  // 5. Skin types
  if (selectedSkinTypes.value.length > 0) {
    result = result.filter(p => {
      const ptypes = [
        ...(Array.isArray(p.skin_type) ? p.skin_type : [p.skin_type]),
        ...(Array.isArray(p.skin_type_tags) ? p.skin_type_tags : []),
      ].filter(Boolean).map(s => s.toLowerCase());
      return selectedSkinTypes.value.some(st => ptypes.some(pt => pt.includes(st.toLowerCase())));
    });
  }

  // 6. Pathologies
  if (selectedPathologies.value.length > 0) {
    result = result.filter(p => {
      const ppaths = [
        ...(Array.isArray(p.pathology) ? p.pathology : [p.pathology]),
        ...(Array.isArray(p.skin_conditions_supported) ? p.skin_conditions_supported : []),
        p.description, p.usage,
      ].filter(Boolean).join(' ').toLowerCase();
      return selectedPathologies.value.some(path => ppaths.includes(path.toLowerCase()));
    });
  }

  // 7. Rating
  if (selectedRating.value > 0) {
    result = result.filter(p => (productAvgRating.value[p._id] || 0) >= selectedRating.value);
  }

  // 8. Sort
  switch (sortBy.value) {
    case 'price_asc':
      result.sort((a, b) => (a.flash_sale_price || a.price || 0) - (b.flash_sale_price || b.price || 0));
      break;
    case 'price_desc':
      result.sort((a, b) => (b.flash_sale_price || b.price || 0) - (a.flash_sale_price || a.price || 0));
      break;
    case 'newest':
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
    case 'sold':
      result.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
      break;
    case 'rating':
      result.sort((a, b) => (productAvgRating.value[b._id] || 0) - (productAvgRating.value[a._id] || 0));
      break;
  }

  return result;
});

// ── PAGINATION ────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / itemsPerPage)));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredProducts.value.slice(start, start + itemsPerPage);
});

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
});

watch(filteredProducts, () => { currentPage.value = 1; });

// ── ACTIVE FILTER COUNT ───────────────────────────────────────
const activeFilterCount = computed(() => {
  let count = 0;
  if (categoryKeyword.value) count++;
  if (selectedBrands.value.length) count += selectedBrands.value.length;
  if (selectedPriceRange.value) count++;
  if (selectedSkinTypes.value.length) count += selectedSkinTypes.value.length;
  if (selectedPathologies.value.length) count += selectedPathologies.value.length;
  if (selectedRating.value) count++;
  return count;
});

const clearAllFilters = () => {
  categoryKeyword.value = "";
  selectedBrands.value = [];
  selectedPriceRange.value = "";
  selectedSkinTypes.value = [];
  selectedPathologies.value = [];
  selectedRating.value = 0;
  searchQuery.value = "";
  sortBy.value = "relevant";
  currentPage.value = 1;
};

// ── TOGGLE HELPERS ────────────────────────────────────────────
const toggleBrand = (id) => {
  const idx = selectedBrands.value.indexOf(id);
  if (idx === -1) selectedBrands.value.push(id);
  else selectedBrands.value.splice(idx, 1);
};
const toggleSkinType = (val) => {
  const idx = selectedSkinTypes.value.indexOf(val);
  if (idx === -1) selectedSkinTypes.value.push(val);
  else selectedSkinTypes.value.splice(idx, 1);
};
const togglePathology = (val) => {
  const idx = selectedPathologies.value.indexOf(val);
  if (idx === -1) selectedPathologies.value.push(val);
  else selectedPathologies.value.splice(idx, 1);
};

// ── ADMIN helpers (kept) ──────────────────────────────────────
const adminFilteredProducts = computed(() => {
  let result = products.value;
  if (selectedSkinType.value) {
    const target = selectedSkinType.value.toLowerCase();
    result = result.filter(p => {
      const s = [...(Array.isArray(p.skin_type) ? p.skin_type : [p.skin_type])].filter(Boolean).join(' ').toLowerCase();
      return s.includes(target);
    });
  }
  if (selectedPathology.value) {
    const target = selectedPathology.value.toLowerCase();
    result = result.filter(p => {
      const s = [p.title, p.description, ...(Array.isArray(p.pathology) ? p.pathology : [p.pathology])].filter(Boolean).join(' ').toLowerCase();
      return s.includes(target);
    });
  }
  if (searchText.value) {
    const kw = searchText.value.toLowerCase();
    result = result.filter(p => [p.title, p.name, p.brand_id?.name].filter(Boolean).join(' ').toLowerCase().includes(kw));
  }
  return result;
});

const fetchProducts = async () => {
  try {
    const response = await productService.getAllProducts();
    products.value = response;
  } catch (error) {
    push.error("Lỗi khi tải danh sách sản phẩm");
  }
};
const goToAddProduct = () => router.push({ name: "product.add" });
const handleDeleteAllProducts = async () => {
  if (confirm("Xác nhận xóa tất cả sản phẩm?")) {
    try { await productService.deleteAllProducts(); push.success("Xóa tất cả thành công"); fetchProducts(); }
    catch { push.error("Đã xảy ra lỗi khi xóa"); }
  }
};
const formatPrice = (price) => {
  if (!price) return "0 đ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
const handleDeleteProduct = async (id) => {
  if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
    try { await productService.deleteProduct(id); push.success("Xóa sản phẩm thành công"); fetchProducts(); }
    catch { push.error("Lỗi khi xóa sản phẩm"); }
  }
};
const editProduct = (id) => router.push({ name: "product.edit", params: { id } });

// ── INIT ──────────────────────────────────────────────────────
onMounted(async () => {
  if (route.query.q) searchQuery.value = route.query.q;
  await fetchData();
  fetchProducts();
  loadRecentlyViewed();
});

watch(() => route.query.q, (val) => {
  if (val !== undefined) searchQuery.value = val || "";
});
</script>

<template>
  <!-- ===== ADMIN VIEW ===== -->
  <template v-if="role === 'STAFF' || role === 'ADMIN'">
    <AdminLayout>
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Quản lý Sản phẩm</h1>
          <p class="text-xs text-gray-500">Xem và cập nhật danh sách mỹ phẩm trong kho hàng</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <InputSearch class="w-60 input-sm h-8" v-model="searchText" placeholder="Tìm kiếm sản phẩm..."></InputSearch>
          <select v-model="selectedSkinType" class="select select-bordered select-sm h-8 min-h-0 text-xs bg-white w-36">
            <option value="">Tất cả loại da</option>
            <option v-for="type in skinTypes" :key="type" :value="type">{{ type }}</option>
          </select>
          <select v-model="selectedPathology" class="select select-bordered select-sm h-8 min-h-0 text-xs bg-white w-36">
            <option value="">Tất cả tình trạng</option>
            <option v-for="path in pathologies" :key="path" :value="path">{{ path }}</option>
          </select>
          <button class="btn btn-primary btn-sm h-8 min-h-0" @click="goToAddProduct">+ Thêm sản phẩm</button>
          <button class="btn btn-outline btn-error btn-sm h-8 min-h-0" @click="handleDeleteAllProducts">Xóa hết</button>
        </div>
      </div>
      <template v-if="adminFilteredProducts.length > 0">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table class="table table-sm table-zebra w-full text-xs">
            <thead class="bg-gray-50 text-gray-600 text-xs">
              <tr>
                <th class="w-16">Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Phân loại</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Hạn dùng</th>
                <th class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in adminFilteredProducts" :key="product._id" class="hover:bg-gray-50">
                <td><div class="w-10 h-10 bg-gray-100 rounded overflow-hidden"><img referrerpolicy="no-referrer" :src="product.image || '/images/product-missing.svg'" class="w-full h-full object-cover" /></div></td>
                <td>
                  <div class="font-bold text-gray-800">{{ product.title }}</div>
                  <div class="text-[10px] text-gray-500">{{ product.brand_id?.name || 'Chưa phân loại' }}</div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="type in product.skin_type" :key="type" class="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] rounded">{{ type }}</span>
                    <span v-for="path in product.pathology" :key="path" class="px-1.5 py-0.5 bg-teal-50 text-teal-600 text-[9px] rounded">{{ path }}</span>
                  </div>
                </td>
                <td>
                  <div class="font-bold text-gray-800">{{ formatPrice(product.price) }}</div>
                  <div v-if="product.flash_sale_price" class="text-[9px] text-red-500 font-bold">⚡ {{ formatPrice(product.flash_sale_price) }}</div>
                </td>
                <td>
                  <span :class="{ 'text-emerald-600 font-bold': product.quantity >= 45, 'text-amber-600 font-bold': product.quantity < 45 && product.quantity >= 15, 'text-red-600 font-bold': product.quantity < 15 }">{{ product.quantity }}</span>
                </td>
                <td class="text-gray-500">{{ product.expiry_date || 'N/A' }}</td>
                <td class="text-right">
                  <div class="flex justify-end gap-1">
                    <button @click="editProduct(product._id)" class="btn btn-ghost btn-xs text-blue-500">Sửa</button>
                    <button @click="handleDeleteProduct(product._id)" class="btn btn-ghost btn-xs text-red-500">Xóa</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <div class="text-4xl mb-3">🔍</div>
          <p class="text-sm font-bold text-gray-400">Không tìm thấy sản phẩm nào phù hợp</p>
        </div>
      </template>
    </AdminLayout>
  </template>

  <!-- ===== CUSTOMER VIEW ===== -->
  <template v-else>
    <div class="flex flex-col min-h-screen bg-[#F7F8F5] font-sans">
      <Header />

      <!-- Mobile Filter Bar -->
      <div class="lg:hidden sticky top-0 z-30 bg-white border-b border-[#E5ECE8] px-4 py-2.5 flex items-center justify-between">
        <button @click="showFilterDrawer = !showFilterDrawer"
          class="flex items-center gap-2 text-sm font-semibold text-[#123F35] bg-[#EBF4EF] border border-[#C9DDD6] rounded-xl px-4 py-2 transition hover:bg-[#D8EDE3]">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18M7 10h10M11 16h2"/></svg>
          Bộ lọc
          <span v-if="activeFilterCount > 0" class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#087F5B] text-white text-[9px] font-black">{{ activeFilterCount }}</span>
        </button>
        <select v-model="sortBy" class="text-xs border border-[#E5ECE8] rounded-lg px-2 py-1.5 text-[#315F53] bg-white focus:outline-none focus:ring-1 focus:ring-[#008A63]">
          <option v-for="s in sortOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>

      <!-- Mobile Filter Drawer Overlay -->
      <transition name="fade">
        <div v-if="showFilterDrawer" class="fixed inset-0 z-40 lg:hidden" @click.self="showFilterDrawer = false">
          <div class="absolute inset-0 bg-black/40"></div>
          <div class="absolute left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto shadow-2xl p-5">
            <div class="flex items-center justify-between mb-5">
              <span class="text-base font-bold text-[#123F35]">Bộ lọc</span>
              <button @click="showFilterDrawer = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Reuse sidebar content here via slot or just repeat -->
            <div class="space-y-5">
              <!-- Categories -->
              <div>
                <p class="text-[11px] font-bold uppercase tracking-widest text-[#123F35] mb-3">Danh mục</p>
                <ul class="space-y-1">
                  <li v-for="cat in sidebarCategories" :key="cat.keyword">
                    <button @click="categoryKeyword = cat.keyword; showFilterDrawer = false"
                      class="w-full text-left px-3 py-2 rounded-lg text-sm transition"
                      :class="categoryKeyword === cat.keyword ? 'bg-[#E8F4EF] text-[#087F5B] font-semibold border-l-2 border-[#087F5B]' : 'text-[#315F53] hover:bg-slate-50'">
                      {{ cat.label }}
                    </button>
                  </li>
                </ul>
              </div>
              <div class="h-px bg-[#E5ECE8]"></div>
              <!-- Price -->
              <div>
                <p class="text-[11px] font-bold uppercase tracking-widest text-[#123F35] mb-3">Khoảng giá</p>
                <ul class="space-y-1.5">
                  <li v-for="pr in priceRanges" :key="pr.value">
                    <label class="flex items-center gap-2.5 cursor-pointer group">
                      <input type="radio" name="price-mobile" :value="pr.value" v-model="selectedPriceRange" class="w-3.5 h-3.5 accent-[#087F5B]" />
                      <span class="text-sm text-[#315F53] group-hover:text-[#087F5B] transition">{{ pr.label }}</span>
                    </label>
                  </li>
                  <li>
                    <label class="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name="price-mobile" value="" v-model="selectedPriceRange" class="w-3.5 h-3.5 accent-[#087F5B]" />
                      <span class="text-sm text-[#315F53]">Tất cả giá</span>
                    </label>
                  </li>
                </ul>
              </div>
              <button v-if="activeFilterCount > 0" @click="clearAllFilters(); showFilterDrawer = false"
                class="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition">
                Xóa tất cả bộ lọc ({{ activeFilterCount }})
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Main Layout -->
      <div class="flex-grow w-full max-w-screen-2xl mx-auto px-4 py-6">
        <div class="flex gap-5 items-start">

          <!-- ══ SIDEBAR ══ -->
          <aside class="hidden lg:block w-64 shrink-0 space-y-3 sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">

            <!-- Danh mục -->
            <div class="bg-white rounded-2xl border border-[#E5ECE8] p-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35] mb-3">Danh mục sản phẩm</p>
              <ul class="space-y-0.5">
                <li v-for="cat in sidebarCategories" :key="cat.keyword">
                  <button @click="categoryKeyword = cat.keyword"
                    class="w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-150"
                    :class="categoryKeyword === cat.keyword
                      ? 'bg-[#E8F4EF] text-[#087F5B] font-semibold border-l-[3px] border-[#087F5B] pl-3'
                      : 'text-[#315F53] hover:bg-[#F4FAF7] hover:text-[#087F5B]'">
                    {{ cat.label }}
                  </button>
                </li>
              </ul>
            </div>

            <!-- Khoảng giá -->
            <div class="bg-white rounded-2xl border border-[#E5ECE8] p-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35] mb-3">Khoảng giá</p>
              <ul class="space-y-2">
                <li v-for="pr in priceRanges" :key="pr.value">
                  <label class="flex items-center gap-2.5 cursor-pointer group">
                    <input type="radio" name="price-desktop" :value="pr.value" v-model="selectedPriceRange"
                      class="w-3.5 h-3.5 accent-[#087F5B] shrink-0" />
                    <span class="text-sm text-[#52635D] group-hover:text-[#087F5B] transition leading-tight">{{ pr.label }}</span>
                  </label>
                </li>
                <li>
                  <label class="flex items-center gap-2.5 cursor-pointer group">
                    <input type="radio" name="price-desktop" value="" v-model="selectedPriceRange" class="w-3.5 h-3.5 accent-[#087F5B] shrink-0" />
                    <span class="text-sm text-[#52635D] group-hover:text-[#087F5B] transition">Tất cả giá</span>
                  </label>
                </li>
              </ul>
            </div>

            <!-- Thương hiệu -->
            <div class="bg-white rounded-2xl border border-[#E5ECE8] p-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35] mb-3">Thương hiệu</p>
              <ul class="space-y-2">
                <li v-for="brand in visibleBrands" :key="brand._id">
                  <label class="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" :value="brand._id" v-model="selectedBrands"
                      class="w-3.5 h-3.5 accent-[#087F5B] rounded shrink-0" />
                    <span class="text-sm text-[#52635D] group-hover:text-[#087F5B] transition truncate" :title="brand.name">{{ brand.name }}</span>
                  </label>
                </li>
              </ul>
              <button v-if="brands.length > 6" @click="showMoreBrands = !showMoreBrands"
                class="mt-2.5 text-xs font-semibold text-[#087F5B] hover:underline transition">
                {{ showMoreBrands ? '▲ Thu gọn' : `▼ Xem thêm ${brands.length - 6} thương hiệu` }}
              </button>
            </div>

            <!-- Loại da -->
            <div class="bg-white rounded-2xl border border-[#E5ECE8] p-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35] mb-3">Loại da</p>
              <ul class="space-y-2">
                <li v-for="st in skinTypeOptions" :key="st">
                  <label class="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" :value="st" :checked="selectedSkinTypes.includes(st)"
                      @change="toggleSkinType(st)" class="w-3.5 h-3.5 accent-[#087F5B] rounded shrink-0" />
                    <span class="text-sm text-[#52635D] group-hover:text-[#087F5B] transition">{{ st }}</span>
                  </label>
                </li>
              </ul>
            </div>

            <!-- Vấn đề da -->
            <div class="bg-white rounded-2xl border border-[#E5ECE8] p-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35] mb-3">Vấn đề da</p>
              <ul class="space-y-2">
                <li v-for="path in pathologyOptions" :key="path">
                  <label class="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" :value="path" :checked="selectedPathologies.includes(path)"
                      @change="togglePathology(path)" class="w-3.5 h-3.5 accent-[#087F5B] rounded shrink-0" />
                    <span class="text-sm text-[#52635D] group-hover:text-[#087F5B] transition">{{ path }}</span>
                  </label>
                </li>
              </ul>
            </div>

            <!-- Đánh giá -->
            <div class="bg-white rounded-2xl border border-[#E5ECE8] p-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35] mb-3">Đánh giá</p>
              <ul class="space-y-2">
                <li v-for="opt in ratingOptions" :key="opt.min">
                  <label class="flex items-center gap-2.5 cursor-pointer group">
                    <input type="radio" name="rating" :value="opt.min" v-model="selectedRating"
                      class="w-3.5 h-3.5 accent-[#087F5B] shrink-0" />
                    <span class="flex items-center gap-1 text-sm text-[#52635D] group-hover:text-[#087F5B] transition">
                      <span class="text-amber-400 text-xs" v-html="'★'.repeat(opt.min) + '☆'.repeat(5 - opt.min)"></span>
                    </span>
                  </label>
                </li>
                <li>
                  <label class="flex items-center gap-2.5 cursor-pointer group">
                    <input type="radio" name="rating" :value="0" v-model="selectedRating" class="w-3.5 h-3.5 accent-[#087F5B] shrink-0" />
                    <span class="text-sm text-[#52635D] group-hover:text-[#087F5B] transition">Tất cả</span>
                  </label>
                </li>
              </ul>
            </div>

            <!-- Xóa bộ lọc -->
            <button v-if="activeFilterCount > 0" @click="clearAllFilters"
              class="w-full py-2.5 rounded-xl border border-red-200 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              Xóa bộ lọc ({{ activeFilterCount }})
            </button>

            <!-- Sản phẩm vừa xem -->
            <div v-if="recentlyViewed.length > 0" class="bg-white rounded-2xl border border-[#E5ECE8] p-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#123F35] mb-3">Vừa xem</p>
              <ul class="space-y-3">
                <li v-for="item in recentlyViewed" :key="item._id">
                  <RouterLink :to="{ name: 'product.detail', params: { id: item._id } }"
                    class="flex items-center gap-2.5 group">
                    <img :src="item.image || '/images/product-missing.svg'" :alt="item.title"
                      class="w-10 h-10 rounded-lg object-cover border border-[#E5ECE8] shrink-0" />
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-[#123F35] line-clamp-2 leading-tight group-hover:text-[#087F5B] transition">{{ item.title }}</p>
                      <p class="text-xs text-[#087F5B] font-bold mt-0.5">{{ (item.price || 0).toLocaleString('vi-VN') }}đ</p>
                    </div>
                  </RouterLink>
                </li>
              </ul>
            </div>

          </aside>

          <!-- ══ MAIN PRODUCT AREA ══ -->
          <div class="flex-1 min-w-0 space-y-4">

            <!-- Top Bar -->
            <div class="bg-white rounded-2xl border border-[#E5ECE8] px-5 py-4">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h1 class="text-xl font-bold text-[#123F35]">
                    Cửa hàng <span class="text-[#087F5B]">SkinMedi AI</span>
                  </h1>
                  <p class="text-xs text-[#66756F] mt-0.5">
                    <span v-if="loading">Đang tải...</span>
                    <span v-else>Hiển thị <strong class="text-[#123F35]">{{ paginatedProducts.length }}</strong> / <strong class="text-[#123F35]">{{ filteredProducts.length }}</strong> sản phẩm</span>
                  </p>
                </div>

                <!-- Search + Sort -->
                <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <div class="relative flex-grow sm:w-60">
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A5BAB2]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input v-model="searchQuery" type="text" placeholder="Tìm kiếm sản phẩm..."
                      class="w-full text-sm pl-9 pr-4 py-2 border border-[#D5E6DE] rounded-xl text-[#123F35] placeholder-[#A5BAB2] bg-white focus:outline-none focus:ring-2 focus:ring-[#008A63]/25 focus:border-[#008A63] transition" />
                  </div>
                  <select v-model="sortBy"
                    class="hidden lg:block text-sm border border-[#D5E6DE] rounded-xl px-3 py-2 text-[#315F53] bg-white focus:outline-none focus:ring-2 focus:ring-[#008A63]/25 focus:border-[#008A63] transition">
                    <option v-for="s in sortOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
              </div>

              <!-- Active filter chips -->
              <div v-if="activeFilterCount > 0" class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#EAECE6]">
                <span v-if="categoryKeyword" class="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#E8F4EF] text-[#087F5B] border border-[#C9DDD6] rounded-full px-3 py-1">
                  📂 {{ sidebarCategories.find(c => c.keyword === categoryKeyword)?.label }}
                  <button @click="categoryKeyword = ''" class="hover:text-red-500 transition">✕</button>
                </span>
                <span v-if="selectedPriceRange" class="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#E8F4EF] text-[#087F5B] border border-[#C9DDD6] rounded-full px-3 py-1">
                  💰 {{ priceRanges.find(p => p.value === selectedPriceRange)?.label }}
                  <button @click="selectedPriceRange = ''" class="hover:text-red-500 transition">✕</button>
                </span>
                <span v-for="b in selectedBrands" :key="b" class="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#E8F4EF] text-[#087F5B] border border-[#C9DDD6] rounded-full px-3 py-1">
                  🏷 {{ brands.find(br => br._id === b)?.name }}
                  <button @click="toggleBrand(b)" class="hover:text-red-500 transition">✕</button>
                </span>
                <span v-if="selectedRating > 0" class="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#E8F4EF] text-[#087F5B] border border-[#C9DDD6] rounded-full px-3 py-1">
                  ⭐ Từ {{ selectedRating }} sao
                  <button @click="selectedRating = 0" class="hover:text-red-500 transition">✕</button>
                </span>
                <button @click="clearAllFilters" class="text-xs text-red-500 font-semibold hover:underline ml-1">Xóa tất cả</button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="bg-white rounded-2xl border border-[#E5ECE8] py-20 flex flex-col items-center justify-center gap-3">
              <div class="w-10 h-10 border-4 border-[#087F5B] border-t-transparent rounded-full animate-spin"></div>
              <p class="text-sm text-[#66756F] font-medium">Đang tải sản phẩm...</p>
            </div>

            <!-- API Error -->
            <div v-else-if="apiError" class="bg-white rounded-2xl border border-red-100 py-16 flex flex-col items-center justify-center gap-3">
              <div class="text-4xl">⚠️</div>
              <p class="text-sm font-semibold text-red-600">Không thể tải danh sách sản phẩm. Vui lòng thử lại.</p>
              <button @click="fetchData" class="mt-2 text-sm font-semibold text-[#087F5B] border border-[#087F5B] px-5 py-2 rounded-xl hover:bg-[#E8F4EF] transition">
                Thử lại
              </button>
            </div>

            <!-- Product Grid -->
            <template v-else-if="paginatedProducts.length > 0">
              <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <ProductCard v-for="product in paginatedProducts" :key="product._id" :product="product" />
              </div>

              <!-- Pagination -->
              <div v-if="totalPages > 1" class="bg-white rounded-2xl border border-[#E5ECE8] px-5 py-4 flex items-center justify-center gap-1.5 flex-wrap">
                <!-- Prev -->
                <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
                  class="w-9 h-9 flex items-center justify-center rounded-xl border border-[#D5E6DE] text-[#315F53] hover:bg-[#E8F4EF] hover:border-[#008A63] transition disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>

                <!-- Page numbers -->
                <template v-for="page in paginationPages" :key="page">
                  <span v-if="page === '...'" class="w-9 h-9 flex items-center justify-center text-[#A5BAB2] text-sm">…</span>
                  <button v-else @click="currentPage = page"
                    class="w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-semibold transition"
                    :class="currentPage === page
                      ? 'bg-[#087F5B] border-[#087F5B] text-white shadow-sm'
                      : 'border-[#D5E6DE] text-[#315F53] hover:bg-[#E8F4EF] hover:border-[#008A63]'">
                    {{ page }}
                  </button>
                </template>

                <!-- Next -->
                <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
                  class="w-9 h-9 flex items-center justify-center rounded-xl border border-[#D5E6DE] text-[#315F53] hover:bg-[#E8F4EF] hover:border-[#008A63] transition disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </template>

            <!-- Empty State -->
            <div v-else class="bg-white rounded-2xl border border-dashed border-[#C9DDD6] py-24 flex flex-col items-center justify-center gap-4">
              <div class="w-20 h-20 rounded-2xl bg-[#F4FAF7] flex items-center justify-center text-4xl">🔍</div>
              <div class="text-center">
                <p class="text-base font-bold text-[#123F35]">Không tìm thấy sản phẩm phù hợp</p>
                <p class="text-sm text-[#66756F] mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
              </div>
              <button @click="clearAllFilters"
                class="mt-1 px-6 py-2.5 bg-[#087F5B] hover:bg-[#006B4A] text-white font-semibold text-sm rounded-xl transition shadow-sm">
                Xóa bộ lọc
              </button>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  </template>
</template>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #C9DDD6 transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #C9DDD6;
  border-radius: 99px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>