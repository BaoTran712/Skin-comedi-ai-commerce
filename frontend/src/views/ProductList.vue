<script setup>
import ProductCard from "../components/ProductCard.vue";
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import InputSearch from "../components/InputSearch.vue";

import { useRouter } from "vue-router";
import { ref, computed, onMounted } from 'vue';
import ProductService from '../services/product.service';
import { push } from "notivue";

const router = useRouter();
const productService = new ProductService();
const role = computed(() => localStorage.getItem("role"));

const products = ref([]);
const searchText = ref("");
const selectedSkinType = ref("");
const selectedPathology = ref("");

const skinTypes = ["da dầu", "da khô", "da nhạy cảm", "da hỗn hợp", "mọi loại da"];
const pathologies = ["mụn", "nám", "tàn nhang", "lão hóa", "mẩn đỏ", "khô da"];

const fetchProducts = async () => {
  try {
    const response = await productService.getAllProducts();
    products.value = response;
  } catch (error) {
    console.error(error);
    push.error("Lỗi khi tải danh sách sản phẩm");
  }
};

const filteredProducts = computed(() => {
  let result = products.value;

  if (selectedSkinType.value) {
    result = result.filter(p => p.skin_type?.includes(selectedSkinType.value));
  }

  if (selectedPathology.value) {
    result = result.filter(p => p.pathology?.includes(selectedPathology.value));
  }

  if (searchText.value) {
    const keyword = searchText.value.toLowerCase();
    result = result.filter(product => {
      const searchableText = [
        product.title, 
        product.usage, 
        product.brand_id?.name,
        ...(product.skin_type || []),
        ...(product.pathology || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }

  return result;
});

const goToAddProduct = () => {
  router.push({ name: "product.add" });
};

const handleDeleteAllProducts = async () => {
  try {
    if (confirm("Xác nhận xóa tất cả sản phẩm?")) {
      await productService.deleteAllProducts();
      push.success("Xóa tất cả sản phẩm thành công");
      fetchProducts();
    }
  } catch (error) {
    console.log(error);
    push.error("Đã xảy ra lỗi khi xóa tất cả sản phẩm");
  }
};

onMounted(async () => {
  fetchProducts();
});
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header></Header>

    <div class="flex-grow mx-8 sm:mx-16 lg:mx-24 my-8">
      <div class="flex flex-col gap-8">
        <!-- Filter Header -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div class="flex flex-col lg:flex-row justify-between items-center gap-6">
            <h1 class="section-title text-gray-900">Cửa hàng <em class="text-primary">Testskin</em></h1>
            
            <div class="flex flex-wrap justify-center gap-4 w-full lg:w-auto">
              <div class="tooltip" data-tip="Tìm theo tên, công dụng, thương hiệu...">
                <InputSearch class="w-64" v-model=" searchText "></InputSearch>
              </div>

              <!-- Skin Type Filter -->
              <select v-model="selectedSkinType" class="select select-bordered w-full sm:w-48">
                <option value="">Tất cả loại da</option>
                <option v-for="type in skinTypes" :key="type" :value="type">{{ type }}</option>
              </select>

              <!-- Pathology Filter -->
              <select v-model="selectedPathology" class="select select-bordered w-full sm:w-48">
                <option value="">Tất cả tình trạng</option>
                <option v-for="path in pathologies" :key="path" :value="path">{{ path }}</option>
              </select>

              <template v-if=" role === 'staff' ">
                <div class="flex gap-2">
                  <button class="btn btn-primary shadow-md" @click=" goToAddProduct ">
                    Thêm sản phẩm
                  </button>
                  <button class="btn btn-ghost text-error" @click=" handleDeleteAllProducts ">
                    Xóa hết
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- list products -->
        <template v-if=" filteredProducts.length > 0 ">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            <ProductCard v-for=" product in filteredProducts " :key=" product._id " :product=" product "></ProductCard>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <div class="text-6xl mb-4">🔍</div>
            <p class="text-xl font-bold text-gray-400">Không tìm thấy sản phẩm nào phù hợp</p>
            <button @click="searchText = ''; selectedSkinType = ''; selectedPathology = ''" class="btn btn-link text-primary mt-2">Đặt lại bộ lọc</button>
          </div>
        </template>
      </div>
    </div>

    <Footer></Footer>
  </div>
</template>