<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="text-center">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <h2 class="mt-4 text-xl font-semibold">Đang xử lý đăng nhập...</h2>
      <p class="text-gray-500">Vui lòng đợi trong giây lát</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { push } from 'notivue';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const { token, user } = route.query;

  if (token && user) {
    try {
      const parsedUser = JSON.parse(decodeURIComponent(user));
      
      let userRole = (parsedUser.role || "CUSTOMER").toUpperCase();
      if (userRole === "USER") userRole = "CUSTOMER";
      if (userRole === "EMPLOYEE") userRole = "STAFF";

      localStorage.setItem("authenticateToken", token);
      localStorage.setItem("user", JSON.stringify(parsedUser));
      localStorage.setItem("username", parsedUser.username);
      localStorage.setItem("id", parsedUser.id);
      localStorage.setItem("role", userRole);
      localStorage.setItem("avatar", parsedUser.avatar || "");
      
      push.success("Đăng nhập thành công!");
      router.push("/");
    } catch (error) {
      console.error("Lỗi khi parse thông tin user:", error);
      push.error("Đăng nhập thất bại. Vui lòng thử lại.");
      router.push("/user/login");
    }
  } else {
    push.error("Đăng nhập thất bại hoặc bị hủy.");
    router.push("/user/login");
  }
});
</script>
