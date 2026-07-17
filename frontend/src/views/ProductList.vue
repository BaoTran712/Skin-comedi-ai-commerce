<script setup>
import ProductCard from "../components/ProductCard.vue";
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import InputSearch from "../components/InputSearch.vue";
import AdminLayout from "../components/AdminLayout.vue";

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

const formatPrice = (price) => {
  if (!price) return "0 đ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const handleDeleteProduct = async (id) => {
  if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
    try {
      await productService.deleteProduct(id);
      push.success("Xóa sản phẩm thành công");
      fetchProducts();
    } catch (error) {
      console.error(error);
      push.error("Lỗi khi xóa sản phẩm");
    }
  }
};

const editProduct = (id) => {
  router.push({ name: "product.edit", params: { id } });
};
</script>

<template>
  <template v-if="role === 'staff'">
    <AdminLayout>
      <!-- Title & Search toolbar -->
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

          <button class="btn btn-primary btn-sm h-8 min-h-0" @click="goToAddProduct">
            + Thêm sản phẩm
          </button>
          <button class="btn btn-outline btn-error btn-sm h-8 min-h-0" @click="handleDeleteAllProducts">
            Xóa hết
          </button>
        </div>
      </div>

      <!-- Data table -->
      <template v-if="filteredProducts.length > 0">
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
              <tr v-for="product in filteredProducts" :key="product._id" class="hover:bg-gray-50">
                <td>
                  <div class="w-10 h-10 bg-gray-100 rounded overflow-hidden shadow-sm">
                    <img :src="product.image || 'https://via.placeholder.com/150'" class="w-full h-full object-cover" />
                  </div>
                </td>
                <td>
                  <div class="font-bold text-gray-800">{{ product.title }}</div>
                  <div class="text-[10px] text-gray-500">{{ product.brand_id?.name || 'Chưa phân loại' }}</div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="type in product.skin_type" :key="type" class="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] rounded capitalize">{{ type }}</span>
                    <span v-for="path in product.pathology" :key="path" class="px-1.5 py-0.5 bg-teal-50 text-teal-600 text-[9px] rounded capitalize">{{ path }}</span>
                  </div>
                </td>
                <td>
                  <div class="font-bold text-gray-800">{{ formatPrice(product.price) }}</div>
                  <div v-if="product.flash_sale_price" class="text-[9px] text-red-500 font-bold">⚡ {{ formatPrice(product.flash_sale_price) }}</div>
                </td>
                <td>
                  <span :class="{
                    'text-emerald-600 font-bold': product.quantity >= 45,
                    'text-amber-600 font-bold': product.quantity < 45 && product.quantity >= 15,
                    'text-red-600 font-bold': product.quantity < 15
                  }">
                    {{ product.quantity }}
                  </span>
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

  <template v-else>
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
</template>