<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-4 mb-6">
          <RouterLink to="/promotions" class="btn btn-circle btn-ghost bg-white border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </RouterLink>
          <h1 class="text-3xl font-bold text-gray-900">Thêm Khuyến Mãi Mới</h1>
        </div>

        <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form @submit.prevent="submitForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Mã khuyến mãi <span class="text-error">*</span></span></label>
                <input type="text" v-model="formData.ma_khuyen_mai" class="input input-bordered w-full font-mono uppercase" placeholder="VD: GIARE20" required />
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Tên chương trình <span class="text-error">*</span></span></label>
                <input type="text" v-model="formData.ten" class="input input-bordered w-full" placeholder="VD: Khuyến mãi mùa hè" required />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Loại giảm giá</span></label>
                <select v-model="formData.loai_giam_gia" class="select select-bordered w-full">
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (đ)</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Giá trị giảm <span class="text-error">*</span></span></label>
                <input type="number" v-model="formData.gia_tri_giam" class="input input-bordered w-full" placeholder="VD: 10 hoặc 50000" required />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Giá trị đơn tối thiểu (đ)</span></label>
                <input type="number" v-model="formData.gia_tri_don_toi_thieu" class="input input-bordered w-full" placeholder="0" />
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Số tiền giảm tối đa (đ)</span></label>
                <input type="number" v-model="formData.so_tien_giam_toi_da" class="input input-bordered w-full" placeholder="Không giới hạn" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Ngày bắt đầu</span></label>
                <input type="datetime-local" v-model="formData.ngay_bat_dau" class="input input-bordered w-full" />
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Ngày kết thúc</span></label>
                <input type="datetime-local" v-model="formData.ngay_ket_thuc" class="input input-bordered w-full" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Giới hạn sử dụng</span></label>
                <input type="number" v-model="formData.gioi_han_su_dung" class="input input-bordered w-full" placeholder="Không giới hạn" />
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold">Trạng thái</span></label>
                <select v-model="formData.trang_thai" class="select select-bordered w-full">
                  <option value="active">Đang chạy</option>
                  <option value="inactive">Đã dừng</option>
                </select>
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-4">
              <RouterLink to="/promotions" class="btn btn-ghost">Hủy</RouterLink>
              <button type="submit" class="btn btn-primary px-8" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="loading loading-spinner"></span>
                Lưu Khuyến Mãi
              </button>
            </div>
          </form>
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
import PromotionService from '../services/promotion.service';
import { push } from 'notivue';

const promotionService = new PromotionService();
const router = useRouter();

const formData = ref({
  ma_khuyen_mai: '',
  ten: '',
  loai_giam_gia: 'percentage',
  gia_tri_giam: '',
  gia_tri_don_toi_thieu: 0,
  so_tien_giam_toi_da: null,
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  gioi_han_su_dung: null,
  trang_thai: 'active'
});

const isSubmitting = ref(false);

const submitForm = async () => {
  if (!formData.value.ma_khuyen_mai || !formData.value.ten || !formData.value.gia_tri_giam) {
    push.warning("Vui lòng nhập đầy đủ thông tin bắt buộc!");
    return;
  }
  
  try {
    isSubmitting.value = true;
    formData.value.ma_khuyen_mai = formData.value.ma_khuyen_mai.toUpperCase();
    await promotionService.createPromotion(formData.value);
    push.success("Đã thêm khuyến mãi thành công!");
    router.push('/promotions');
  } catch (error) {
    console.error(error);
    push.error("Có lỗi xảy ra khi thêm khuyến mãi");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  const role = localStorage.getItem("role");
  if (role !== "staff") {
    router.push("/");
  }
});
</script>
