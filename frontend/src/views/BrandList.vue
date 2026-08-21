<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import InputSearch from '../components/InputSearch.vue';

import BrandService from "../services/brand.service";
import BrandCard from '../components/BrandCard.vue';
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { push } from 'notivue';

const publisherService = new BrandService();
const router = useRouter();
const brands = ref([]);
const searchText = ref("");
const role = computed(() => (localStorage.getItem("role") || "").toUpperCase());

const fetchBrands = async () => {
    try {
        const response = await publisherService.getAllBrands();
        // debug code later
        // console.log(response);
        brands.value = response;
    } catch (error) {
        console.error(error);
    }
};

const searchFilteredPublishers = computed(() => {
    if (!searchText.value) return brands.value;

    const keyword = searchText.value.toLowerCase();

    return brands.value.filter(brand => {
        const searchableText = [brand.name, brand.address]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return searchableText.includes(keyword);
    });
});

const goToAddPublisher = () => {
    router.push({ name: "brand.add" });
};

const handleDeleteAllPublishers = async () => {
    try {
        if (confirm("Xác nhận xóa tất cả Thương hiệu?")) {
            await publisherService.deleteAllBrands();
            push.success("Xóa tất cả Thương hiệu thành công");
            fetchBrands();
        }
    } catch (error) {
        console.log(error);
        push.error("Đã xảy ra lỗi khi xóa tất cả Thương hiệu");
    }
};

onMounted(async () => {
    if (role.value !== "STAFF" && role.value !== "ADMIN") {
        router.push("/");
    }
    fetchBrands();
});
</script>

<template>
    <div class="flex flex-col min-h-screen">
        <Header></Header>
        <section class="flex-grow mx-8 sm:mx-16 lg:mx-24 my-8">

            <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <div class="tooltip" data-tip="Tên Thương hiệu, địa chỉ">
                    <InputSearch class="w-full" v-model=" searchText "></InputSearch>
                </div>

                <template v-if=" role === 'STAFF' || role === 'ADMIN' ">
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
                        <button class="btn btn-neutral hover:btn-info hover:text-white hover:scale-[1.01]"
                            @click=" goToAddPublisher ">Thêm Thương hiệu</button>
                        <button class="btn btn-neutral hover:btn-error hover:text-white hover:scale-[1.01]"
                            @click=" handleDeleteAllPublishers ">Xóa tất cả</button>
                    </div>
                </template>
            </div>

            <template v-if=" searchFilteredPublishers.length > 0 ">
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-8 mt-8">
                    <BrandCard v-for=" brand in searchFilteredPublishers " :key=" brand._id "
                        :brand=" brand "></BrandCard>
                </div>
            </template>
            <template v-else>
                <div class="grid grid-cols-1 text-center mt-8">

                    <p class="py-6 font-bold">Lỗi không thể tìm thấy người dùng</p>
                </div>
            </template>
        </section>
        <Footer></Footer>
    </div>
</template>