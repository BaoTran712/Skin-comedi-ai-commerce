<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

import { useRouter, useRoute } from 'vue-router';
import { ref, onMounted, computed } from "vue";
import BrandService from '../services/brand.service';
import { push } from 'notivue';
import { publisherSchema } from "../validations/brand.validation";
import { useForm, useField } from "vee-validate";

const publisherService = new BrandService();
const router = useRouter();
const route = useRoute();
const brand_id = route.params.id;
const role = computed(() => localStorage.getItem("role"));

const { handleSubmit, resetForm } = useForm({
    validationSchema: publisherSchema,
});

const handlePublisherProfileEdit = handleSubmit(async (values) => {
    try {
        await publisherService.updateBrand(brand_id, values);

        push.success("Cập nhật thông tin Thương hiệu thành công");
        router.push("/brands");
    } catch (error) {
        console.log(error);
        push.error("Đã xảy ra lỗi khi cập nhật thông tin Thương hiệu");
    }
});

const handlePublisherProfileDelete = async (brand_id) => {
    try {
        if (confirm("Xác nhận xóa Thương hiệu?")) {
            await publisherService.deleteBrand(brand_id);
            push.success("Xóa Thương hiệu thành công");
            router.push("/brands");
        }
    } catch (error) {
        push.error("Đã xảy ra lỗi khi xóa Thương hiệu");
        console.log(error);
    }
};

const { value: name, errorMessage: nameError } = useField("name");
const { value: address, errorMessage: addressError } = useField("address");

onMounted(async () => {
    if (role.value !== "staff") {
        router.push("/");
    }
    try {
        const publisherData = await publisherService.getBrandById(brand_id);
        resetForm({
            values: {
                name: publisherData.name,
                address: publisherData.address
            }
        });
    } catch (error) {
        console.log(error);
    }
});
</script>

<template>
    <div class="flex min-h-screen flex-col">
        <Header></Header>
        <div class="flex justify-center items-center flex-grow">
            <form @submit.prevent class="mb-24">
                <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4 text-base">
                    <legend class="fieldset-legend text-xl">Chỉnh sửa Thương hiệu</legend>

                    <label class="label" for="name">Tên Thương hiệu</label>
                    <input v-model=" name " type="text" class="input w-full" id="name" placeholder="Nhập tên Thương hiệu" />
                    <span class="text-sm text-red-600">{{ nameError }}</span>

                    <label class="label" for="address">Địa chỉ</label>
                    <input v-model=" address " type="text" class="input w-full" id="address" placeholder="Nhập địa chỉ" />
                    <span class="text-sm text-red-600">{{ addressError }}</span>

                    <div class="grid grid-cols-2 gap-2">
                        <button @click=" handlePublisherProfileEdit( brand_id )"
                            class="btn btn-neutral mt-4 hover:scale-[1.01] text-base">Cập nhật</button>
                        <button @click=" handlePublisherProfileDelete( brand_id )"
                            class="btn btn-neutral mt-4 hover:scale-[1.01] text-base">Xóa</button>
                    </div>

                    <span class="mt-8">
                        <strong class="hover:underline">
                            <RouterLink to="/brands" class="text-base">Quay lại</RouterLink>
                        </strong>
                    </span>
                </fieldset>
            </form>
        </div>
        <Footer></Footer>
    </div>
</template>