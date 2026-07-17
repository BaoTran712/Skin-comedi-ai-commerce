<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import { ref, onMounted } from "vue";
import PostService from "../services/post.service";
import { push } from "notivue";

const postService = new PostService();
const posts = ref([]);

const fetchPosts = async () => {
    try {
        posts.value = await postService.getAllPosts();
    } catch (error) {
        console.error("Lỗi tải bài viết", error);
    }
};

onMounted(() => {
    fetchPosts();
});

const deletePost = async (id) => {
    if (confirm("Bạn có chắc muốn xóa bài viết này?")) {
        try {
            await postService.deletePost(id);
            push.success("Đã xóa bài viết");
            fetchPosts();
        } catch (error) {
            push.error("Lỗi khi xóa bài viết");
        }
    }
};
</script>

<template>
    <AdminLayout>
        <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h1 class="text-xl font-bold text-gray-800">Quản lý bài viết</h1>
            <button class="btn btn-primary btn-sm" @click="push.info('Chức năng thêm bài viết đang phát triển')">+ Thêm bài mới</button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table class="table table-sm table-zebra w-full text-xs">
                <thead class="bg-gray-50 text-gray-600 text-xs">
                    <tr>
                        <th class="w-20">Ảnh</th>
                        <th>Tiêu đề</th>
                        <th>Tóm tắt</th>
                        <th>Trạng thái</th>
                        <th class="text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="post in posts" :key="post._id">
                        <td>
                            <div class="w-12 h-8 bg-gray-100 rounded overflow-hidden">
                                <img :src="post.thumbnail" class="w-full h-full object-cover" />
                            </div>
                        </td>
                        <td class="font-bold">{{ post.title }}</td>
                        <td class="max-w-[200px] truncate">{{ post.summary }}</td>
                        <td>
                            <span class="badge badge-sm" :class="post.status === 'published' ? 'badge-success text-white' : 'badge-ghost'">
                                {{ post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp' }}
                            </span>
                        </td>
                        <td class="text-right">
                            <button class="btn btn-ghost btn-xs text-blue-500">Sửa</button>
                            <button @click="deletePost(post._id)" class="btn btn-ghost btn-xs text-red-500">Xóa</button>
                        </td>
                    </tr>
                    <tr v-if="posts.length === 0">
                        <td colspan="5" class="text-center py-4 text-gray-400">Chưa có bài viết</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </AdminLayout>
</template>
