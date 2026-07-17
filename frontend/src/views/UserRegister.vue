<script setup>
import { ref } from "vue";
import UserService from "../services/user.service";
import { useRouter } from "vue-router";
import { useForm, useField } from "vee-validate";
import { userSchema } from "../validations/user.validation";
import { push } from "notivue";

const userService = new UserService();
const router = useRouter();

const { handleSubmit } = useForm({
  validationSchema: userSchema
});

const { value: first_name, errorMessage: first_nameError } = useField("first_name");
const { value: last_name, errorMessage: last_nameError } = useField("last_name");
const { value: username, errorMessage: usernameError } = useField("username");
const { value: password, errorMessage: passwordError } = useField("password");
const { value: birthday, errorMessage: birthdayError } = useField("birthday");
const { value: gender, errorMessage: genderError } = useField("gender");
const { value: address, errorMessage: addressError } = useField("address");
const { value: phone, errorMessage: phoneError } = useField("phone");

const handleUserRegister = handleSubmit(async (values) => {
  try {
    await userService.register(values);
    // ? Debug code
    // console.log(data);
    // console.log(response.data);

    push.success("Đăng ký người dùng thành công");
    router.push("/user/login");
  } catch (error) {
    console.error(error);
    if (error.response.status === 400) {
      push.error("Vui lòng điền đầy đủ thông tin");
    } else if (error.response.status === 409) {
      push.error("Tên đăng nhập đã tồn tại");
    }
    else {
      push.error("Đăng ký thất bại, vui lòng thử lại");
    }
  }
});

const loginWithGoogle = () => {
  window.location.href = "http://localhost:3000/api/auth/google";
};

const loginWithFacebook = () => {
  window.location.href = "http://localhost:3000/api/auth/facebook";
};

</script>

<template>
  <div class="bg-cover bg-[url(/images/t2_khu_vuc_tu_hoc_2.jpg)] transition-all duration-300 overflow-hidden">
    <div class="backdrop-brightness-50 backdrop-blur-xs flex justify-center items-center h-screen">
      <form @submit.prevent=" handleUserRegister ">
        <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4 text-base shadow">
          <h1 class="font-bold text-2xl text-center">Đăng Ký</h1>
          <label class="label" for="last_name">Họ lót</label>
          <input v-model=" last_name " type="text" class="input" id="last_name" placeholder="Nhập họ lót" />
          <span class="text-red-600 text-sm">{{ last_nameError }}</span>

          <label class="label" for="first_name">Tên</label>
          <input v-model=" first_name " type="text" class="input" id="first_name" placeholder="Nhập tên" />
          <span class="text-red-600 text-sm">{{ first_nameError }}</span>

          <label class="label" for="birthday">Ngày sinh</label>
          <input v-model=" birthday " type="date" id="birthday" class="input" />
          <span class="text-red-600 text-sm">{{ birthdayError }}</span>

          <label class="label">Giới tính</label>
          <div class="flex gap-8">
            <div><input v-model=" gender " :value=" true " type="radio" name="radio-1" class="radio mr-1" />
              <span>Nam</span>
            </div>
            <div class=""><input v-model=" gender " :value=" false " type="radio" name="radio-1" class="radio mr-1" />
              <span>Nữ</span>
            </div>
          </div>
          <span class="text-red-600 text-sm">{{ genderError }}</span>

          <label class="label" for="address">Địa chỉ</label>
          <input v-model=" address " type="text" class="input" id="address" placeholder="Nhập địa chỉ" />
          <span class="text-red-600 text-sm">{{ addressError }}</span>

          <label class="label" for="phone">Số điện thoại</label>
          <input v-model=" phone " type="text" class="input" id="phone" placeholder="Nhập số điện thoại" />
          <span class="text-red-600 text-sm">{{ phoneError }}</span>

          <label class="label" for="username">Tên đăng nhập</label>
          <input v-model=" username " type="text" class="input" id="username" placeholder="Nhập tên đăng nhập" />
          <span class="text-red-600 text-sm">{{ usernameError }}</span>

          <label class="label" for="password">Mật khẩu</label>
          <input v-model=" password " type="password" class="input" id="password" placeholder="Nhập mật khẩu" />
          <span class="text-red-600 text-sm">{{ passwordError }}</span>

          <button type="submit" class="btn btn-neutral mt-4 hover:scale-[1.01] text-base">Đăng Ký</button>

          <div class="divider my-2">HOẶC</div>
          
          <button @click.prevent="loginWithGoogle" type="button" class="btn btn-outline w-full mb-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-5 h-5 mr-2">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Google
          </button>
          
          <button @click.prevent="loginWithFacebook" type="button" class="btn btn-outline w-full mb-4 bg-[#1877F2] text-white hover:bg-[#166FE5] border-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 mr-2" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>

          <span class="mt-4">Bạn đã có tài khoản?
            <strong class="hover:underline">
              <RouterLink to="/user/login" class="text-base">Đăng nhập</RouterLink>
            </strong>
          </span>
        </fieldset>
      </form>
    </div>
  </div>
</template>