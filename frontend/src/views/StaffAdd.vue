<script setup>
import AdminLayout from '../components/AdminLayout.vue';
import { ref } from "vue";
import { useRouter } from "vue-router";
import { push } from 'notivue';
import StaffService from '../services/staff.service';

const router = useRouter();
const staffService = new StaffService();

const firstName = ref("");
const lastName = ref("");
const username = ref("");
const phone = ref("");
const password = ref("");
const confirmPassword = ref("");
const address = ref("");
const avatar = ref("");
const isSubmitting = ref(false);

const handleCreateStaff = async () => {
  if (!username.value || !password.value || !firstName.value || !lastName.value) {
    push.warning("Vui lòng điền đầy đủ các thông tin bắt buộc!");
    return;
  }

  if (password.value !== confirmPassword.value) {
    push.error("Mật khẩu xác nhận không trùng khớp!");
    return;
  }

  if (password.value.length < 6) {
    push.warning("Mật khẩu phải có ít nhất 6 ký tự!");
    return;
  }

  try {
    isSubmitting.value = true;
    const payload = {
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      name: `${firstName.value.trim()} ${lastName.value.trim()}`,
      username: username.value.trim(),
      email: username.value.trim(),
      phone: phone.value.trim(),
      password: password.value,
      address: address.value.trim(),
      avatar: avatar.value.trim(),
      role: "STAFF" // Fixed role STAFF
    };

    const res = await staffService.createStaff(payload);
    push.success(res.message || "Tạo tài khoản nhân viên thành công!");
    router.push("/staffs");
  } catch (error) {
    console.error("Create Staff Error:", error);
    const msg = error.response?.data?.message || "Lỗi khi tạo tài khoản nhân viên";
    push.error(msg);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AdminLayout>
    <div class="max-w-3xl mx-auto py-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Thêm nhân viên mới</h1>
          <p class="text-xs text-gray-500 mt-1">Tạo tài khoản vận hành cho nhân viên (Role: STAFF)</p>
        </div>
        <RouterLink to="/staffs" class="btn btn-outline btn-sm rounded-lg text-xs">
          ← Quay lại danh sách
        </RouterLink>
      </div>

      <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form @submit.prevent="handleCreateStaff" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs">Họ lót <span class="text-red-500">*</span></span></label>
              <input v-model="firstName" type="text" placeholder="Nguyễn Văn" class="input input-bordered input-sm rounded-lg" required />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs">Tên <span class="text-red-500">*</span></span></label>
              <input v-model="lastName" type="text" placeholder="A" class="input input-bordered input-sm rounded-lg" required />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs">Email / Tên đăng nhập <span class="text-red-500">*</span></span></label>
              <input v-model="username" type="email" placeholder="nhanvien@skinmedi.vn" class="input input-bordered input-sm rounded-lg" required />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs">Số điện thoại</span></label>
              <input v-model="phone" type="text" placeholder="0901234567" class="input input-bordered input-sm rounded-lg" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs">Mật khẩu <span class="text-red-500">*</span></span></label>
              <input v-model="password" type="password" placeholder="Tối thiểu 6 ký tự" class="input input-bordered input-sm rounded-lg" required />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs">Xác nhận mật khẩu <span class="text-red-500">*</span></span></label>
              <input v-model="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" class="input input-bordered input-sm rounded-lg" required />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs">Địa chỉ</span></label>
              <input v-model="address" type="text" placeholder="Địa chỉ nơi ở" class="input input-bordered input-sm rounded-lg" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs">Vai trò hệ thống</span></label>
              <input type="text" value="STAFF (Nhân viên vận hành)" class="input input-bordered input-sm rounded-lg bg-gray-100 font-bold text-emerald-700 cursor-not-allowed" disabled />
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-xs">URL Ảnh đại diện (Tùy chọn)</span></label>
            <input v-model="avatar" type="text" placeholder="https://..." class="input input-bordered input-sm rounded-lg" />
          </div>

          <div class="flex justify-end gap-3 border-t pt-6">
            <RouterLink to="/staffs" class="btn btn-ghost btn-sm rounded-lg">Hủy</RouterLink>
            <button type="submit" :disabled="isSubmitting" class="btn btn-primary btn-sm rounded-lg px-8 shadow-md">
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs mr-1"></span>
              ✅ Tạo tài khoản STAFF
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>