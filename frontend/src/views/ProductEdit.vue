<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

import BrandService from '../services/brand.service';
import ProductService from "../services/product.service";
import VariantService from "../services/variant.service";
import { useRouter, useRoute } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { push } from 'notivue';
import { useForm, useField } from "vee-validate";
import { productSchema } from '../validations/product.validation';

const bookService = new ProductService();
const publisherService = new BrandService();
const variantService = new VariantService();
const router = useRouter();
const route = useRoute();
const brands = ref([]);
const product = ref({});

const hasVariants = ref(false);
const variants = ref([]);
const deletedVariantIds = ref([]);

const addVariantRow = () => {
  variants.value.push({ attrName: '', attrValue: '', price: 0, quantity: 0, image: '' });
};

const removeVariantRow = (index) => {
  const v = variants.value[index];
  if (v._id || v.id) {
    deletedVariantIds.value.push(v._id || v.id);
  }
  variants.value.splice(index, 1);
};

const product_id = route.params.id;
const role = computed(() => localStorage.getItem("role"));

const imagesList = ref([]);
const newImageUrl = ref("");
const isDragging = ref(false);

const addImageUrl = () => {
  if (newImageUrl.value.trim()) {
    imagesList.value.push(newImageUrl.value.trim());
    newImageUrl.value = "";
  }
};

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      imagesList.value.push(ev.target.result);
    };
    reader.readAsDataURL(file);
  });
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files);
  files.forEach(file => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        imagesList.value.push(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  });
};

const removeImage = (index) => {
  imagesList.value.splice(index, 1);
};

const makeCover = (index) => {
  if (index > 0) {
    const item = imagesList.value.splice(index, 1)[0];
    imagesList.value.unshift(item);
  }
};

const moveImage = (index, direction) => {
  const targetIndex = index + direction;
  if (targetIndex >= 0 && targetIndex < imagesList.value.length) {
    const temp = imagesList.value[index];
    imagesList.value[index] = imagesList.value[targetIndex];
    imagesList.value[targetIndex] = temp;
  }
};

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
        imagesList.value = book_data.images || (book_data.image ? [book_data.image] : []);
        hasVariants.value = book_data.has_variants || false;
        if (book_data.flash_sale_price || book_data.flash_sale_end_time) {
            isFlashSale.value = true;
        }

        if (hasVariants.value) {
            const data = await variantService.getVariantsByProductId(product_id);
            variants.value = data.map(v => ({
                _id: v._id || v.id,
                attrName: v.attributes?.[0]?.name || '',
                attrValue: v.attributes?.[0]?.value || '',
                price: v.price,
                quantity: v.quantity,
                image: v.image
            }));
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
        payload.has_variants = hasVariants.value;
        payload.image = imagesList.value[0] || "";
        payload.images = imagesList.value;
        await bookService.updateProduct(product_id, payload);

        // Update variants
        if (hasVariants.value) {
            // Delete removed variants
            for (const id of deletedVariantIds.value) {
                await variantService.deleteVariant(id);
            }
            // Add or update variants
            for (const v of variants.value) {
                const variantData = {
                    product_id,
                    attributes: [{ name: v.attrName, value: v.attrValue }],
                    price: v.price,
                    quantity: v.quantity,
                    image: v.image
                };
                if (v._id || v.id) {
                    await variantService.updateVariant(v._id || v.id, variantData);
                } else {
                    await variantService.createVariant(variantData);
                }
            }
        }

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

                    <!-- Advanced Image Manager -->
                    <div class="mt-4 p-4 border border-base-300 rounded-lg bg-base-100 flex flex-col gap-2 text-left">
                        <label class="label font-bold text-slate-700 text-xs">🖼️ Quản lý hình ảnh sản phẩm</label>
                        
                        <div class="join w-full">
                            <input v-model="newImageUrl" type="text" placeholder="Dán URL hình ảnh vào đây..." class="input input-bordered join-item w-full input-xs" />
                            <button type="button" @click="addImageUrl" class="btn btn-xs btn-primary join-item">Thêm URL</button>
                        </div>

                        <div 
                            @dragover.prevent="isDragging = true" 
                            @dragleave.prevent="isDragging = false"
                            @drop.prevent="handleDrop"
                            :class="isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 bg-white'"
                            class="border border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary transition"
                            @click="$refs.fileInput.click()"
                        >
                            <input type="file" ref="fileInput" class="hidden" multiple accept="image/*" @change="handleFileSelect" />
                            <span class="text-lg">📥</span>
                            <p class="text-[10px] text-slate-500 mt-1 font-semibold">Kéo thả hình ảnh hoặc nhấp để tải lên</p>
                        </div>

                        <div v-if="imagesList.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                            <div 
                                v-for="(imgUrl, idx) in imagesList" 
                                :key="idx" 
                                class="group relative rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-sm"
                            >
                                <img :src="imgUrl" class="w-full h-full object-cover" />
                                
                                <span v-if="idx === 0" class="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-black px-1 py-0.5 rounded shadow-sm">
                                    ẢNH BÌA
                                </span>

                                <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-1.5">
                                    <button type="button" @click="removeImage(idx)" class="btn btn-xs btn-circle btn-error self-end text-white font-bold h-4 w-4 min-h-0">✕</button>
                                    <div class="flex justify-between items-center gap-0.5">
                                        <div class="flex gap-0.5">
                                            <button type="button" :disabled="idx === 0" @click="moveImage(idx, -1)" class="btn btn-xs btn-square bg-white text-slate-800 border-none disabled:opacity-40 h-5 w-5 min-h-0">◀</button>
                                            <button type="button" :disabled="idx === imagesList.length - 1" @click="moveImage(idx, 1)" class="btn btn-xs btn-square bg-white text-slate-800 border-none disabled:opacity-40 h-5 w-5 min-h-0">▶</button>
                                        </div>
                                        <button v-if="idx !== 0" type="button" @click="makeCover(idx)" class="btn btn-xs btn-success text-white font-extrabold text-[8px] px-1 h-5 min-h-0">Đặt Bìa</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p v-else class="text-[10px] text-slate-400 text-center py-2 font-medium">Chưa có hình ảnh nào.</p>
                    </div>

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

                    <!-- Variants Config -->
                    <div class="mt-4 p-4 border border-base-300 rounded-lg bg-base-100 flex flex-col gap-2">
                        <label class="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" v-model="hasVariants" class="toggle toggle-success" />
                            <span class="label-text font-bold text-success flex items-center gap-2">
                                📦 Thuộc tính nâng cao (Biến thể)
                            </span>
                        </label>

                        <div v-if="hasVariants" class="flex flex-col gap-2 transition-all">
                            <div class="overflow-x-auto w-full">
                                <table class="table w-full text-xs">
                                    <thead>
                                        <tr class="bg-emerald-100/50">
                                            <th>Thuộc tính</th>
                                            <th>Giá trị</th>
                                            <th>Giá</th>
                                            <th>Kho</th>
                                            <th>Ảnh URL</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(v, idx) in variants" :key="idx">
                                            <td><input v-model="v.attrName" placeholder="Màu sắc" class="input input-xs input-bordered w-full" /></td>
                                            <td><input v-model="v.attrValue" placeholder="Đỏ" class="input input-xs input-bordered w-full" /></td>
                                            <td><input v-model="v.price" type="number" placeholder="Giá" class="input input-xs input-bordered w-16" /></td>
                                            <td><input v-model="v.quantity" type="number" placeholder="Kho" class="input input-xs input-bordered w-12" /></td>
                                            <td><input v-model="v.image" placeholder="URL" class="input input-xs input-bordered w-full" /></td>
                                            <td><button type="button" @click="removeVariantRow(idx)" class="text-red-500 font-bold text-xs">✕</button></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" @click="addVariantRow" class="btn btn-xs btn-outline btn-success w-fit mt-2">
                                + Thêm phân loại
                            </button>
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