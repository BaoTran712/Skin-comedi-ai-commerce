<script setup>
import { ref, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useForm, useField } from "vee-validate";
import { userSchema } from "../validations/user.validation";
import { push } from "notivue";
import UserService from "../services/user.service";

const userService = new UserService();
const router = useRouter();
const route = useRoute();

const { handleSubmit } = useForm({
  validationSchema: userSchema
});

const { value: first_name, errorMessage: first_nameError } = useField("first_name");
const { value: last_name, errorMessage: last_nameError } = useField("last_name");
const { value: username, errorMessage: usernameError } = useField("username");
const { value: password, errorMessage: passwordError } = useField("password");
const { value: confirm_password, errorMessage: confirm_passwordError } = useField("confirm_password");
const { value: birthday, errorMessage: birthdayError } = useField("birthday");
const { value: gender, errorMessage: genderError } = useField("gender");
const { value: address, errorMessage: addressError } = useField("address");
const { value: phone, errorMessage: phoneError } = useField("phone");

// Province/District Location Selectors
import LocationService from "../services/location.service";
const provincesList = ref([]);
const districtsList = ref([]);
const selectedProvince = ref("");
const selectedDistrict = ref("");

// Fetch provinces on mount
const loadProvinces = async () => {
  try {
    provincesList.value = await LocationService.getProvinces();
  } catch (err) {
    console.error("Lỗi tải danh sách tỉnh thành:", err);
  }
};

const handleProvinceChange = async () => {
  districtsList.value = [];
  selectedDistrict.value = "";
  address.value = "";
  if (selectedProvince.value) {
    try {
      districtsList.value = await LocationService.getDistricts(selectedProvince.value);
    } catch (e) {
      console.error(e);
    }
  }
};

const handleDistrictChange = () => {
  const provObj = provincesList.value.find(p => p.code == selectedProvince.value);
  const distObj = districtsList.value.find(d => d.code == selectedDistrict.value);
  if (provObj && distObj) {
    address.value = `${distObj.name}, ${provObj.name}`;
  }
};

// OTP States
const showOtpModal = ref(false);
const otpCode = ref("");
const otpExpiry = ref(300); // 5 mins in seconds
const resendCooldown = ref(0); // Cooldown for resend in seconds
let otpTimer = null;
let cooldownTimer = null;

const startOTPTimers = () => {
  // Reset timers
  otpExpiry.value = 300;
  resendCooldown.value = 60;
  
  clearInterval(otpTimer);
  clearInterval(cooldownTimer);

  otpTimer = setInterval(() => {
    if (otpExpiry.value > 0) {
      otpExpiry.value--;
    } else {
      clearInterval(otpTimer);
    }
  }, 1000);

  cooldownTimer = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--;
    } else {
      clearInterval(cooldownTimer);
    }
  }, 1000);
};

const handleUserRegister = handleSubmit(
  async (values) => {
    try {
      const payload = {
        ...values,
        selectedProvince: selectedProvince.value,
        selectedDistrict: selectedDistrict.value
      };
      const res = await userService.register(payload);
      push.success(res.data?.message || "Đăng ký tài khoản thành công!");
      setTimeout(() => {
        router.push({ path: "/user/login", query: { redirect: route.query.redirect } });
      }, 1500);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400) {
        push.error(error.response?.data?.message || "Vui lòng kiểm tra lại thông tin");
      } else if (error.response?.status === 409) {
        push.error(error.response?.data?.message || "Email hoặc số điện thoại đã tồn tại");
      } else {
        push.error(error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại");
      }
    }
  },
  ({ errors }) => {
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      push.warning(errorMessages[0]);
    }
  }
);

const handleVerifyOTP = async () => {
  if (!otpCode.value || otpCode.value.length !== 6) {
    push.warning("Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số!");
    return;
  }
  try {
    const res = await userService.verifyOTP(username.value, otpCode.value);
    push.success(res.message || "Xác thực tài khoản thành công!");
    showOtpModal.value = false;
    router.push({ path: "/user/login", query: { redirect: route.query.redirect } });
  } catch (error) {
    console.error(error);
    push.error(error.response?.data?.message || "Xác thực OTP thất bại!");
  }
};

const handleResendOTP = async () => {
  if (resendCooldown.value > 0) return;
  try {
    const res = await userService.resendOTP(username.value);
    push.success(res.message || "Đã gửi lại mã OTP mới!");
    startOTPTimers();
  } catch (error) {
    console.error(error);
    push.error("Không thể gửi lại mã OTP, vui lòng thử lại.");
  }
};

import { onMounted } from "vue";
onMounted(() => {
  loadProvinces();
});

onBeforeUnmount(() => {
  clearInterval(otpTimer);
  clearInterval(cooldownTimer);
});

const loginWithGoogle = () => {
  window.location.href = "http://localhost:3000/api/auth/google";
};

const loginWithFacebook = () => {
  window.location.href = "http://localhost:3000/api/auth/facebook";
};
</script>

<template>
  <div class="min-h-screen bg-cover bg-[url(/images/t2_khu_vuc_tu_hoc_2.jpg)] transition-all duration-300 overflow-y-auto py-12 flex justify-center items-center">
    <div class="backdrop-brightness-50 backdrop-blur-xs flex justify-center items-center w-full px-4">
      <form v-if="!showOtpModal" @submit.prevent="handleUserRegister" class="w-full max-w-md">
        <fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-6 text-base shadow-2xl">
          <h1 class="font-bold text-3xl text-center mb-6 text-teal-600">Đăng Ký</h1>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label" for="last_name">Họ lót</label>
              <input v-model="last_name" type="text" class="input w-full" id="last_name" placeholder="Nhập họ lót" />
              <span class="text-red-600 text-sm block mt-1">{{ last_nameError }}</span>
            </div>
            <div>
              <label class="label" for="first_name">Tên</label>
              <input v-model="first_name" type="text" class="input w-full" id="first_name" placeholder="Nhập tên" />
              <span class="text-red-600 text-sm block mt-1">{{ first_nameError }}</span>
            </div>
          </div>

          <div class="mt-4">
            <label class="label" for="birthday">Ngày sinh</label>
            <input v-model="birthday" type="date" id="birthday" class="input w-full" />
            <span class="text-red-600 text-sm block mt-1">{{ birthdayError }}</span>
          </div>

          <div class="mt-4">
            <label class="label">Giới tính</label>
            <div class="flex gap-8">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="gender" :value="true" type="radio" class="radio radio-primary" />
                <span>Nam</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="gender" :value="false" type="radio" class="radio radio-primary" />
                <span>Nữ</span>
              </label>
            </div>
            <span class="text-red-600 text-sm block mt-1">{{ genderError }}</span>
          </div>

           <div class="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label class="label font-bold text-xs" for="province">Tỉnh / Thành phố <span class="text-red-500">*</span></label>
              <select v-model="selectedProvince" @change="handleProvinceChange" class="select select-bordered select-sm w-full rounded-xl text-xs" id="province" required>
                <option value="">Chọn Tỉnh / Thành phố</option>
                <option v-for="prov in provincesList" :key="prov.code" :value="prov.code">{{ prov.name }}</option>
              </select>
            </div>
            <div>
              <label class="label font-bold text-xs" for="district">Quận / Huyện <span class="text-red-500">*</span></label>
              <select v-model="selectedDistrict" @change="handleDistrictChange" :disabled="!selectedProvince" class="select select-bordered select-sm w-full rounded-xl text-xs" id="district" required>
                <option value="">Chọn Quận / Huyện</option>
                <option v-for="dist in districtsList" :key="dist.code" :value="dist.code">{{ dist.name }}</option>
              </select>
            </div>
          </div>
          <!-- Hidden address input holding string output for validator -->
          <input type="hidden" v-model="address" />
          <span class="text-red-600 text-sm block mt-1">{{ addressError }}</span>

          <div class="mt-4">
            <label class="label" for="phone">Số điện thoại</label>
            <input v-model="phone" type="text" class="input w-full" id="phone" placeholder="Nhập số điện thoại" />
            <span class="text-red-600 text-sm block mt-1">{{ phoneError }}</span>
          </div>

          <div class="mt-4">
            <label class="label" for="username">Email</label>
            <input v-model="username" type="text" class="input w-full" id="username" placeholder="example@gmail.com" />
            <span class="text-red-600 text-sm block mt-1">{{ usernameError }}</span>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label class="label" for="password">Mật khẩu</label>
              <input v-model="password" type="password" class="input w-full" id="password" placeholder="VD: Admin@123" />
              <span class="text-red-600 text-xs block mt-1 leading-tight">{{ passwordError }}</span>
            </div>
            <div>
              <label class="label" for="confirm_password">Xác nhận mật khẩu</label>
              <input v-model="confirm_password" type="password" class="input w-full" id="confirm_password" placeholder="Nhập lại mật khẩu" />
              <span class="text-red-600 text-xs block mt-1 leading-tight">{{ confirm_passwordError }}</span>
            </div>
          </div>
          <p class="text-[11px] text-gray-400 mt-1">
            🔒 Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt (@$!%*?&#...)
          </p>

          <button type="submit" class="btn btn-neutral w-full mt-6 hover:scale-[1.01] text-base bg-teal-600 hover:bg-teal-700 text-white border-none">Đăng Ký</button>

          <div class="divider my-4">HOẶC</div>
          
          <button @click.prevent="loginWithGoogle" type="button" class="btn btn-outline w-full mb-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-5 h-5 mr-2">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Google
          </button>
          
          <button @click.prevent="loginWithFacebook" type="button" class="btn btn-outline w-full bg-[#1877F2] text-white hover:bg-[#166FE5] border-none mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 mr-2" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>

          <span class="mt-4 text-center block text-sm">
            Bạn đã có tài khoản?
            <RouterLink to="/user/login" class="text-teal-600 hover:underline font-semibold ml-1">Đăng nhập ngay</RouterLink>
          </span>
        </fieldset>
      </form>

      <!-- OTP verification UI -->
      <div v-else class="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl text-center text-xs">
        <div class="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-3xl">mail</span>
        </div>
        <h1 class="font-black text-2xl text-[#064E3B] mb-2">Xác Thực Email</h1>
        <p class="text-slate-500 font-medium mb-6">Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến<br><strong class="text-slate-800">{{ username }}</strong></p>
        
        <div class="form-control mb-6">
          <input 
            v-model="otpCode" 
            type="text" 
            maxlength="6" 
            class="input input-bordered text-center text-2xl tracking-[12px] font-black py-7 rounded-2xl border-slate-200 focus:border-teal-500 focus:ring-teal-100" 
            placeholder="------" 
          />
          <span class="text-xs text-slate-400 mt-3 block font-semibold">
            Mã OTP hết hạn sau: 
            <span class="text-red-500 font-bold">{{ Math.floor(otpExpiry / 60) }}:{{ (otpExpiry % 60).toString().padStart(2, '0') }}</span>
          </span>
          <span class="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 block font-medium text-left">
            💡 <strong>Môi trường thử nghiệm</strong>: Vui lòng kiểm tra tab terminal chạy server backend hoặc check hộp thư để lấy mã OTP 6 số.
          </span>
        </div>

        <button 
          @click="handleVerifyOTP" 
          class="btn w-full bg-teal-600 hover:bg-teal-700 text-white border-none rounded-2xl text-sm font-bold py-3 mb-4 shadow-md transition-all hover:scale-[1.01]"
          :disabled="otpExpiry === 0"
        >
          Xác nhận
        </button>

        <div class="flex flex-col items-center gap-1">
          <span class="text-slate-400 font-medium">Bạn chưa nhận được mã?</span>
          <button 
            @click="handleResendOTP" 
            class="btn btn-ghost btn-xs text-teal-600 font-bold hover:bg-teal-50 px-4 py-1 rounded-lg"
            :disabled="resendCooldown > 0"
          >
            {{ resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>