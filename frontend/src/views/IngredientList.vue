<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Quản lý Thành phần</h1>
          <p class="text-gray-500 mt-1">Quản lý từ điển thành phần mỹ phẩm (Ingredients)</p>
        </div>
        <RouterLink to="/ingredient/add" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm thành phần
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-gray-50">
              <tr>
                <th>Tên thành phần</th>
                <th>Công dụng chính</th>
                <th>Mức độ an toàn</th>
                <th class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ingredients.length === 0">
                <td colspan="4" class="text-center py-8 text-gray-500">Chưa có dữ liệu thành phần nào.</td>
              </tr>
              <tr v-for="item in ingredients" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="font-medium text-gray-800">{{ item.name }}</td>
                <td class="text-gray-600 max-w-xs truncate" :title="item.benefits">{{ item.benefits || 'Đang cập nhật' }}</td>
                <td>
                  <span class="badge" :class="getSafetyBadgeClass(item.safety_level)">
                    {{ item.safety_level || 'Chưa đánh giá' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-2">
                    <RouterLink :to="`/ingredient/edit/${item.id}`" class="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50">
                      Sửa
                    </RouterLink>
                    <button @click="deleteIngredient(item.id)" class="btn btn-sm btn-ghost text-red-600 hover:bg-red-50">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import IngredientService from '../services/ingredient.service';
import { push } from 'notivue';

const ingredientService = new IngredientService();
const ingredients = ref([]);
const router = useRouter();

const fetchIngredients = async () => {
  try {
    ingredients.value = await ingredientService.getAllIngredients();
  } catch (error) {
    console.error(error);
    push.error('Không thể tải danh sách thành phần');
  }
};

const deleteIngredient = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa thành phần này?')) {
    try {
      await ingredientService.deleteIngredient(id);
      push.success('Xóa thành phần thành công!');
      fetchIngredients();
    } catch (error) {
      console.error(error);
      push.error('Có lỗi xảy ra khi xóa thành phần');
    }
  }
};

const getSafetyBadgeClass = (level) => {
  const safeStr = (level || '').toLowerCase();
  if (safeStr.includes('an toàn') || safeStr.includes('xanh') || safeStr === '1' || safeStr === '2') return 'badge-success badge-outline';
  if (safeStr.includes('trung bình') || safeStr.includes('vàng') || safeStr === '3' || safeStr === '4') return 'badge-warning badge-outline';
  if (safeStr.includes('nguy hiểm') || safeStr.includes('đỏ') || safeStr === '5') return 'badge-error badge-outline';
  return 'badge-ghost badge-outline';
};

onMounted(() => {
  const role = localStorage.getItem("role");
  if (role !== "staff") {
    router.push("/");
    return;
  }
  fetchIngredients();
});
</script>
