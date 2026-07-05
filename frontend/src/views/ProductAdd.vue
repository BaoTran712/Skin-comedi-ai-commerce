<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

import BrandService from '../services/brand.service';
import ProductService from "../services/product.service";
import { useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { push } from 'notivue';
import { useForm, useField } from "vee-validate";
import { productSchema } from '../validations/product.validation';

const productService = new ProductService();
const brandService = new BrandService();
const router = useRouter();
const role = computed(() => localStorage.getItem("role"));

const { handleSubmit } = useForm({
  validationSchema: productSchema,
  initialValues: {
    title: "",
    usage: "",
    price: undefined,
    expiry_date: "",
    quantity: undefined,
    brand_id: "",
    skin_type: "",
    pathology: "",
    image: "",
  }
});

const { value: title, errorMessage: titleError } = useField("title");
const { value: usage, errorMessage: usageError } = useField("usage");
const { value: price, errorMessage: priceError } = useField("price");
const { value: expiry_date, errorMessage: expiryDateError } = useField("expiry_date");
const { value: brand_id, errorMessage: brandIdError } = useField("brand_id");
const { value: quantity, errorMessage: quantityError } = useField("quantity");
const { value: skin_type, errorMessage: skinTypeError } = useField("skin_type");
const { value: pathology, errorMessage: pathologyError } = useField("pathology");
const { value: image, errorMessage: imageError } = useField("image");

const isFlashSale = ref(false);
const { value: flash_sale_price, errorMessage: flashSalePriceError } = useField("flash_sale_price");
const { value: flash_sale_end_time, errorMessage: flashSaleEndTimeError } = useField("flash_sale_end_time");

const brands = ref([]);

const fetchBrands = async () => {
  try {
    const brands_data = await brandService.getAllBrands();
    brands.value = brands_data;
  } catch (error) {
    console.log(error);
  }
};

const handleCreateProduct = handleSubmit(async (values) => {
  try {
    const payload = { ...values };
    
    // Split comma-separated strings into arrays for backend
    if (payload.skin_type) {
      payload.skin_type = payload.skin_type.split(',').map(s => s.trim());
    } else {
      payload.skin_type = [];
    }
    
    if (payload.pathology) {
      payload.pathology = payload.pathology.split(',').map(s => s.trim());
    } else {
      payload.pathology = [];
    }

    if (!isFlashSale.value) {
      delete payload.flash_sale_price;
      delete payload.flash_sale_end_time;
    }
    await productService.createProduct(payload);

    push.success("Thêm sản phẩm thành công");
    router.push("/products");
  } catch (error) {
    console.log(error);
    if (error.response?.status === 400) {
      push.error("Vui lòng điền đầy đủ thông tin");
    } else {
      push.error("Đã xảy ra lỗi khi thêm sản phẩm");
    }
  }
});

onMounted(async () => {
  if (role.value !== "staff") {
    router.push("/");
  }
  fetchBrands();
});
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header></Header>
    <div class="flex flex-grow justify-center py-12 px-4">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 class="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Thêm mới sản phẩm</h1>
        
        <form @submit.prevent=" handleCreateProduct " class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label class="label font-semibold text-gray-700" for="title">Tên sản phẩm</label>
            <input v-model=" title " type="text" class="input input-bordered w-full" id="title" placeholder="Nhập tên sản phẩm (ví dụ: Kem chống nắng La Roche-Posay)" />
            <span class="text-xs text-red-600 mt-1">{{ titleError }}</span>
          </div>

          <div class="md:col-span-2">
            <label class="label font-semibold text-gray-700" for="usage">Công dụng</label>
            <textarea v-model=" usage " class="textarea textarea-bordered w-full h-24" id="usage" placeholder="Nhập công dụng và mô tả sản phẩm"></textarea>
            <span class="text-xs text-red-600 mt-1">{{ usageError }}</span>
          </div>

          <div>
            <label class="label font-semibold text-gray-700" for="brand">Thương hiệu</label>
            <select v-model=" brand_id " class="select select-bordered w-full" id="brand">
              <option disabled value="">Chọn thương hiệu</option>
              <option v-for=" brand in brands " :key=" brand._id " :value=" brand._id ">
                {{ brand.name }}
              </option>
            </select>
            <span class="text-xs text-red-600 mt-1">{{ brandIdError }}</span>
          </div>

          <div>
            <label class="label font-semibold text-gray-700" for="expiry_date">Hạn sử dụng</label>
            <input v-model=" expiry_date " type="text" class="input input-bordered w-full" id="expiry_date"
              placeholder="Ví dụ: 12/2026 hoặc 36 tháng" />
            <span class="text-xs text-red-600 mt-1">{{ expiryDateError }}</span>
          </div>

          <div>
            <label class="label font-semibold text-gray-700" for="price">Đơn giá (VNĐ)</label>
            <input v-model=" price " type="number" class="input input-bordered w-full" id="price" placeholder="Nhập đơn giá" />
            <span class="text-xs text-red-600 mt-1">{{ priceError }}</span>
          </div>

          <div>
            <label class="label font-semibold text-gray-700" for="quantity">Số lượng nhập kho</label>
            <input v-model=" quantity " type="number" class="input input-bordered w-full" id="quantity" placeholder="Nhập số lượng" />
            <span class="text-xs text-red-600 mt-1">{{ quantityError }}</span>
          </div>

          <div class="md:col-span-2">
            <label class="label font-semibold text-gray-700" for="image">Link hình ảnh sản phẩm</label>
            <input v-model=" image " type="text" class="input input-bordered w-full" id="image" placeholder="https://example.com/image.jpg" />
            <span class="text-xs text-red-600 mt-1">{{ imageError }}</span>
          </div>

          <div>
            <label class="label font-semibold text-gray-700" for="skin_type">Loại da (phân cách bằng dấu phẩy)</label>
            <input v-model=" skin_type " type="text" class="input input-bordered w-full" id="skin_type" placeholder="da dầu, da khô, da nhạy cảm" />
            <span class="text-xs text-red-600 mt-1">{{ skinTypeError }}</span>
          </div>

          <div>
            <label class="label font-semibold text-gray-700" for="pathology">Bệnh lý/Tình trạng da</label>
            <input v-model=" pathology " type="text" class="input input-bordered w-full" id="pathology" placeholder="mụn, nám, tàn nhang" />
            <span class="text-xs text-red-600 mt-1">{{ pathologyError }}</span>
          </div>

          <!-- Flash sale config -->
          <div class="md:col-span-2 mt-4 p-6 border border-warning/20 rounded-2xl bg-warning/5 flex flex-col gap-4">
            <label class="label cursor-pointer justify-start gap-4 p-0">
              <input type="checkbox" v-model="isFlashSale" class="toggle toggle-warning" />
              <span class="label-text font-bold text-warning text-lg flex items-center gap-2">
                ⚡ Kích hoạt Flash Sale cho sản phẩm này
              </span>
            </label>

            <div v-if="isFlashSale" class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
              <div>
                <label class="label font-semibold text-gray-700" for="flash_sale_price">Giá Flash Sale (VNĐ)</label>
                <input v-model=" flash_sale_price " type="number" class="input input-bordered w-full" id="flash_sale_price" placeholder="Nhập giá ưu đãi" />
                <span class="text-xs text-red-600 mt-1">{{ flashSalePriceError }}</span>
              </div>

              <div>
                <label class="label font-semibold text-gray-700" for="flash_sale_end_time">Thời gian kết thúc</label>
                <input v-model=" flash_sale_end_time " type="datetime-local" class="input input-bordered w-full" id="flash_sale_end_time" />
                <span class="text-xs text-red-600 mt-1">{{ flashSaleEndTimeError }}</span>
              </div>
            </div>
          </div>

          <div class="md:col-span-2 flex items-center gap-4 mt-8 pt-6 border-t">
            <button type="submit" class="btn btn-primary btn-lg flex-grow shadow-lg shadow-primary/30">
              Lưu sản phẩm
            </button>
            <RouterLink to="/products" class="btn btn-ghost btn-lg px-8">Hủy</RouterLink>
          </div>
        </form>
      </div>
    </div>
    <Footer></Footer>
  </div>
</template>