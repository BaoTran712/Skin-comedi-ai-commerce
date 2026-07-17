<script setup>
import AdminSidebar from "./AdminSidebar.vue";
import AdminTopbar from "./AdminTopbar.vue";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
    const role = localStorage.getItem("role");
    if (role !== "staff") {
        router.push("/");
    }
});
</script>

<template>
    <div class="flex h-screen overflow-hidden bg-gray-50 font-sans">
        <!-- Sidebar Menu -->
        <AdminSidebar />
        
        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            <!-- Topbar -->
            <AdminTopbar />
            
            <!-- Page Content -->
            <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
                <slot></slot>
            </main>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #94a3b8;
}
</style>
