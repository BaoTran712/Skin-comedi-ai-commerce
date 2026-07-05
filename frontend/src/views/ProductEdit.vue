<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

import BrandService from '../services/brand.service';
import ProductService from "../services/product.service";
import { useRouter, useRoute } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { push } from 'notivue';
import { useForm, useField } from "vee-validate";
import { productSchema } from '../validations/product.validation';

const bookService = new ProductService();
const publisherService = new BrandService();
const router = useRouter();
const route = useRoute();
const brands = ref([]);
const product = ref({});

const product_id = route.params.id;
const role = computed(() => localStorage.getItem("role"));

const { handleSubmit, resetForm } = useForm({
    validationSchema: productSchema,
});

const { value: title, errorMessage: titleError } = useField("title");
const { value: usage, errorMessage: authorError } = useField("usage");
const { value: price, errorMessage: priceError } = useField("price");
const { value: expiry_date, errorMessage: published_yearError } = useField("expiry_date");
const { value: brand_id, errorMessage: brand_idError } = useField("brand_id");
const { value: quantity, errorMessage: quantityError } = useField("quantity");

const isFlashSale = ref(false);
const { value: flash_sale_price, errorMessage: flashSalePriceError } = useField("flash_sale_price");
const { value: flash_sale_end_time, errorMessage: flashSaleEndTimeError } = useField("flash_sale_end_time");

const fetchProduct = async () => {
    try {
        const book_data = await bookService.getProduct(product_id);
        resetForm({
            values: {
                title: book_data.title,
                usage: book_data.usage,
                price: book_data.price,
                expiry_date: book_data.expiry_date,
                brand_id: book_data.brand_id?._id,
                quantity: book_data.quantity,
                flash_sale_price: book_data.flash_sale_price || undefined,
                flash_sale_end_time: book_data.flash_sale_end_time ? new Date(book_data.flash_sale_end_time).toISOString().slice(0, 16) : undefined
            }
        });
        if (book_data.flash_sale_price || book_data.flash_sale_end_time) {
            isFlashSale.value = true;
        }
    } catch (error) {
        console.log(error);
    }
};

const fetchBrands = async () => {
    try {
        const publishers_data = await publisherService.getAllBrands();
        brands.value = publishers_data;
    } catch (error) {
        console.log(error);
    }
};


const handleUpdateProduct = handleSubmit(async (values) => {
    try {
        const payload = { ...values };
        if (!isFlashSale.value) {
            payload.flash_sale_price = null;
            payload.flash_sale_end_time = null;
        }
        await bookService.updateProduct(product_id, payload);

        push.success("Cập nhật sản phẩm thành công");
        router.push("/products");
    } catch (error) {
        console.log(error);
        push.error("Đã xảy ra lỗi khi cập nhật sản phẩm");
    }
});

const handleDeleteProduct = async (product_id) => {
    try {
        if (confirm("Xác nhận xóa sản phẩm?")) {
            await bookService.deleteProduct(product_id);
            push.success("Xóa sản phẩm thành công");
            router.push("/products");
        }
    } catch (error) {
        console.log(error);
        push.error("Đã xảy ra lỗi khi xóa sản phẩm");
    }
};

onMounted(async () => {
    if (role.value !== "staff") {
        router.push("/");
    }
    fetchProduct();
    fetchBrands();
});
</script>

<template>
    <div class="flex flex-col min-h-screen">
        <Header></Header>
        <div class="flex flex-grow justify-center items-center">
            <form @submit.prevent>
                <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4 text-base">
                    <legend class="fieldset-legend text-xl">Cập nhật sản phẩm</legend>
                    <label class="label" for="title">Tên sản phẩm</label>
                    <input v-model=" title " type="text" class="input" id="title" placeholder="Nhập tên sản phẩm" />
                    <span class="text-sm text-red-600">{{ titleError }}</span>

                    <label class="label" for="usage">Công dụng</label>
                    <input v-model=" usage " type="text" class="input" id="usage" placeholder="Nhập công dụng" />
                    <span class="text-sm text-red-600">{{ authorError }}</span>

                    <label class="label" for="brand">Thương hiệu</label>
                    <select v-model=" brand_id " class="select" id="brand">
                        <option disabled value="">Chọn thương hiệu</option>
                        <option v-for=" brand in brands " :key=" brand._id " :value=" brand._id ">
                            {{ brand.name }}
                        </option>
                    </select>
                    <span class="text-sm text-red-600">{{ brand_idError }}</span>

                    <label class="label" for="expiry_date">Hạn sử dụng</label>
                    <input v-model=" expiry_date " type="text" class="input" id="expiry_date" placeholder="Nhập hạn sử dụng" />
                    <span class="text-sm text-red-600">{{ published_yearError }}</span>

                    <label class="label" for="price">Đơn giá</label>
                    <input v-model=" price " type="number" class="input" id="price" placeholder="Nhập đơn giá" />
                    <span class="text-sm text-red-600">{{ priceError }}</span>

                    <label class="label" for="quantity">Số lượng</label>
                    <input v-model=" quantity " type="number" class="input" id="quantity" placeholder="Nhập số lượng" />
                    <span class="text-sm text-red-600">{{ quantityError }}</span>

                    <!-- Flash sale config -->
                    <div class="mt-4 p-4 border border-base-300 rounded-lg bg-base-100 flex flex-col gap-2">
                        <label class="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" v-model="isFlashSale" class="toggle toggle-warning" />
                            <span class="label-text font-bold text-warning flex items-center gap-2">
                                ⚡ Kích hoạt Flash Sale
                            </span>
                        </label>

                        <div v-if="isFlashSale" class="flex flex-col gap-2 transition-all">
                            <label class="label" for="flash_sale_price">Giá Flash Sale (VNĐ)</label>
                            <input v-model=" flash_sale_price " type="number" class="input" id="flash_sale_price" placeholder="Nhập giá ưu đãi" />
                            <span class="text-sm text-red-600">{{ flashSalePriceError }}</span>

                            <label class="label" for="flash_sale_end_time">Thời gian kết thúc</label>
                            <input v-model=" flash_sale_end_time " type="datetime-local" class="input" id="flash_sale_end_time" />
                            <span class="text-sm text-red-600">{{ flashSaleEndTimeError }}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <button @click="handleUpdateProduct( product_id )"
                            class="btn btn-neutral mt-4 hover:scale-[1.01] text-base">Cập
                            nhật</button>
                        <button class="btn btn-neutral mt-4 hover:scale-[1.01] text-base"
                            @click=" handleDeleteProduct( product_id )">Xóa</button>
                    </div>

                    <span class="mt-4">
                        <strong class="hover:underline">
                            <RouterLink to="/products" class="text-base">Quay lại</RouterLink>
                        </strong>
                    </span>
                </fieldset>
            </form>
        </div>
        <Footer></Footer>
    </div>
</template>