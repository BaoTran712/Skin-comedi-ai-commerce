<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps({
    brand: {
        type: Object,
        required: true
    }
});

const goToEditPublisher = (brand_id) => {
    router.push({ name: "brand.edit", params: { id: brand_id } });
}

</script>

<template>
    <div
        class="flex flex-wrap flex-col shadow rounded-lg overflow-hidden hover:shadow-lg hover:scale-[1.001] transition">
        <div class="flow-root">
            <dl class="divide-y divide-gray-200 rounded border border-gray-200 text-sm">
                <div class="grid grid-cols-2 p-1.5">
                    <dt class="font-bold text-gray-900">Tên Thương hiệu</dt>

                    <dd class="text-gray-800 sm:col-span-2 truncate">{{ brand.name || "Không xác định" }}</dd>
                </div>

                <div class="grid grid-cols-2 p-1.5">
                    <dt class="font-bold text-gray-900">Địa chỉ</dt>

                    <dd class="text-gray-800 sm:col-span-2 truncate">{{ brand.address || "Không xác định" }}</dd>
                </div>

                <div class="grid grid-cols-1">
                    <button @click=" goToEditPublisher( brand._id )"
                        class="btn btn-ghost text-base hover:underline hover:btn-info hover:text-white">Chỉnh
                        sửa</button>
                </div>

            </dl>
        </div>

    </div>
</template>