<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { push } from "notivue";

const router = useRouter();
const username = computed(() => localStorage.getItem("username"));
const role = computed(() => localStorage.getItem("role"));

const logout = () => {
    localStorage.removeItem("authenticateToken");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("id");
    localStorage.removeItem("avatar");
    push.success("Đăng xuất thành công!");
    router.push("/");
    setTimeout(() => {
        window.location.reload();
    }, 500);
};
</script>

<template>
    <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-10 shrink-0">
        <div class="flex items-center gap-4">
            <h2 class="text-lg font-bold text-gray-800">Bảng Điều Khiển</h2>
        </div>

        <div class="flex items-center gap-6">
            <a href="/" target="_blank" class="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                <span class="material-symbols-outlined text-lg">open_in_new</span> Xem Website
            </a>
            
            <div class="h-6 w-px bg-gray-300"></div>

            <div class="dropdown dropdown-end">
                <button tabindex="0" class="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                        {{ username ? username.charAt(0).toUpperCase() : 'A' }}
                    </div>
                    <div class="text-left hidden sm:block">
                        <p class="text-sm font-bold text-gray-700">{{ username || 'Admin' }}</p>
                        <p class="text-xs text-gray-500 capitalize">{{ role || 'Staff' }}</p>
                    </div>
                    <span class="material-symbols-outlined text-gray-400">expand_more</span>
                </button>
                <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg mt-2 border border-gray-100">
                    <li><RouterLink to="/staffprofile" class="font-medium text-gray-700 hover:text-emerald-600">Hồ sơ cá nhân</RouterLink></li>
                    <div class="divider my-1"></div>
                    <li><a @click="logout" class="font-bold text-red-500 hover:text-red-600 hover:bg-red-50">Đăng xuất</a></li>
                </ul>
            </div>
        </div>
    </header>
</template>
