<template>
  <AdminLayout>
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <RouterLink to="/promotions" class="btn btn-circle btn-ghost btn-sm bg-gray-50 hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
        </RouterLink>
        <h1 class="text-lg font-bold text-gray-900">Thêm Khuyến Mãi Mới</h1>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-xs">
        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Mã khuyến mãi *</span></label>
              <input type="text" v-model="formData.ma_khuyen_mai" class="input input-bordered input-sm w-full font-mono uppercase bg-white" placeholder="VD: GIARE20" required />
            </div>

            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Tên chương trình *</span></label>
              <input type="text" v-model="formData.ten" class="input input-bordered input-sm w-full bg-white" placeholder="VD: Khuyến mãi mùa hè" required />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Loại giảm giá</span></label>
              <select v-model="formData.loai_giam_gia" class="select select-bordered select-sm w-full bg-white text-xs">
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Giá trị giảm *</span></label>
              <input type="number" v-model="formData.gia_tri_giam" class="input input-bordered input-sm w-full bg-white" placeholder="VD: 10 hoặc 50000" required />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Giá trị đơn tối thiểu (đ)</span></label>
              <input type="number" v-model="formData.gia_tri_don_toi_thieu" class="input input-bordered input-sm w-full bg-white" placeholder="0" />
            </div>

            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Số tiền giảm tối đa (đ)</span></label>
              <input type="number" v-model="formData.so_tien_giam_toi_da" class="input input-bordered input-sm w-full bg-white" placeholder="Không giới hạn" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Ngày bắt đầu</span></label>
              <input type="datetime-local" v-model="formData.ngay_bat_dau" class="input input-bordered input-sm w-full bg-white text-xs" />
            </div>

            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Ngày kết thúc</span></label>
              <input type="datetime-local" v-model="formData.ngay_ket_thuc" class="input input-bordered input-sm w-full bg-white text-xs" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Giới hạn sử dụng</span></label>
              <input type="number" v-model="formData.gioi_han_su_dung" class="input input-bordered input-sm w-full bg-white" placeholder="Không giới hạn" />
            </div>

            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs font-bold text-gray-700">Trạng thái</span></label>
              <select v-model="formData.trang_thai" class="select select-bordered select-sm w-full bg-white text-xs">
                <option value="active">Đang chạy</option>
                <option value="inactive">Đã dừng</option>
              </select>
            </div>
          </div>

          <div class="pt-4 flex justify-end gap-2">
            <RouterLink to="/promotions" class="btn btn-ghost btn-sm text-xs">Hủy</RouterLink>
            <button type="submit" class="btn btn-primary btn-sm px-6 text-xs font-bold h-8 min-h-0" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              Lưu Khuyến Mãi
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '../components/AdminLayout.vue';
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
  const role = (localStorage.getItem("role") || "").toUpperCase();
  if (role !== "STAFF" && role !== "ADMIN") {
    router.push("/");
  }
});
</script>
