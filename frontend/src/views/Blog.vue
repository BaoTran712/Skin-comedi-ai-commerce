<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import { ref, onMounted } from "vue";
import PostService from "../services/post.service";
import { useRouter } from "vue-router";

const postService = new PostService();
const posts = ref([]);
const router = useRouter();

onMounted(async () => {
    try {
        const data = await postService.getAllPosts();
        // Lọc bài viết đã publish
        posts.value = data.filter(p => p.status === 'published');
    } catch (error) {
        console.error("Lỗi khi tải bài viết", error);
    }
});

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
};
</script>

<template>
    <div class="flex flex-col min-h-screen bg-gray-50">
        <Header />
        
        <main class="flex-grow container mx-auto px-4 py-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h1 class="text-2xl font-bold text-gray-800 border-b border-emerald-500 inline-block pb-1">Tin tức & Khuyến mãi</h1>
                <p class="text-sm text-gray-500 mt-2">Cập nhật những thông tin mới nhất và kiến thức chăm sóc da</p>
            </div>

            <!-- Shopee style blog grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div v-for="post in posts" :key="post._id" 
                     @click="router.push(`/blog/${post._id}`)"
                     class="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group">
                    <div class="relative h-40 overflow-hidden bg-gray-100">
                        <img :src="post.thumbnail || 'https://via.placeholder.com/400x300?text=No+Image'" 
                             alt="thumbnail" 
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div class="p-4">
                        <h3 class="font-bold text-sm text-gray-800 line-clamp-2 group-hover:text-emerald-600 transition-colors">{{ post.title }}</h3>
                        <p class="text-xs text-gray-500 mt-2 line-clamp-2">{{ post.summary }}</p>
                        <div class="mt-4 flex items-center justify-between text-[10px] text-gray-400">
                            <span>{{ post.author_id?.name || 'Admin' }}</span>
                            <span>{{ formatDate(post.createdAt) }}</span>
                        </div>
                    </div>
                </div>
                
                <div v-if="posts.length === 0" class="col-span-full py-12 text-center text-gray-400">
                    Chưa có bài viết nào.
                </div>
            </div>
        </main>

        <Footer />
    </div>
</template>
