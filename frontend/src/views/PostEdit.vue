<script setup>
import AdminLayout from "../components/AdminLayout.vue";
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import PostService from "../services/post.service";
import { push } from "notivue";

const postService = new PostService();
const router = useRouter();
const route = useRoute();

const title = ref("");
const thumbnail = ref("");
const summary = ref("");
const content = ref("");
const status = ref("published");
const loading = ref(false);
const fetching = ref(true);

onMounted(async () => {
    try {
        const post = await postService.getPostById(route.params.id);
        title.value = post.title || "";
        thumbnail.value = post.thumbnail || "";
        summary.value = post.summary || "";
        content.value = post.content || "";
        status.value = post.status || "published";
    } catch (error) {
        console.error(error);
        push.error("Không tìm thấy bài viết");
        router.push("/posts");
    } finally {
        fetching.value = false;
    }
});

const handleSubmit = async () => {
    if (!title.value.trim() || !summary.value.trim() || !content.value.trim()) {
        push.warning("Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung");
        return;
    }
    loading.value = true;
    try {
        await postService.updatePost(route.params.id, {
            title: title.value.trim(),
            thumbnail: thumbnail.value.trim() || "https://placehold.co/800x400?text=No+Image",
            summary: summary.value.trim(),
            content: content.value.trim(),
            status: status.value
        });
        push.success("Cập nhật bài viết thành công!");
        router.push("/posts");
    } catch (error) {
        console.error(error);
        push.error("Lỗi khi cập nhật bài viết");
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <AdminLayout>
        <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h1 class="text-xl font-bold text-gray-800">Chỉnh sửa bài viết</h1>
            <RouterLink to="/posts" class="btn btn-ghost btn-sm">← Quay lại</RouterLink>
        </div>

        <div v-if="fetching" class="flex justify-center py-16">
            <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form @submit.prevent="handleSubmit" class="space-y-5">
                <!-- Tiêu đề -->
                <div class="form-control">
                    <label class="label"><span class="label-text font-semibold">Tiêu đề <span class="text-red-500">*</span></span></label>
                    <input v-model="title" type="text" class="input input-bordered w-full" placeholder="Nhập tiêu đề bài viết" />
                </div>

                <!-- Ảnh đại diện -->
                <div class="form-control">
                    <label class="label"><span class="label-text font-semibold">Ảnh đại diện (URL)</span></label>
                    <input v-model="thumbnail" type="text" class="input input-bordered w-full" placeholder="Dán link ảnh đại diện, ví dụ: https://..." />
                    <div v-if="thumbnail" class="mt-2">
                        <img :src="thumbnail" class="w-48 h-28 object-cover rounded-lg border" @error="(e) => e.target.style.display='none'" />
                    </div>
                </div>

                <!-- Tóm tắt -->
                <div class="form-control">
                    <label class="label"><span class="label-text font-semibold">Tóm tắt <span class="text-red-500">*</span></span></label>
                    <textarea v-model="summary" class="textarea textarea-bordered w-full" rows="3" placeholder="Mô tả ngắn gọn nội dung bài viết"></textarea>
                </div>

                <!-- Nội dung -->
                <div class="form-control">
                    <label class="label"><span class="label-text font-semibold">Nội dung chi tiết <span class="text-red-500">*</span></span></label>
                    <textarea v-model="content" class="textarea textarea-bordered w-full" rows="12" placeholder="Viết nội dung bài viết tại đây..."></textarea>
                </div>

                <!-- Trạng thái -->
                <div class="form-control">
                    <label class="label"><span class="label-text font-semibold">Trạng thái</span></label>
                    <select v-model="status" class="select select-bordered w-full max-w-xs">
                        <option value="published">Xuất bản</option>
                        <option value="draft">Bản nháp</option>
                    </select>
                </div>

                <!-- Nút -->
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                        {{ loading ? 'Đang lưu...' : 'Lưu thay đổi' }}
                    </button>
                    <RouterLink to="/posts" class="btn btn-ghost">Hủy</RouterLink>
                </div>
            </form>
        </div>
    </AdminLayout>
</template>
