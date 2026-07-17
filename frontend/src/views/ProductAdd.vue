<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

import BrandService from '../services/brand.service';
import ProductService from "../services/product.service";
import VariantService from "../services/variant.service";
import { useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { push } from 'notivue';
import { useForm, useField } from "vee-validate";
import { productSchema } from '../validations/product.validation';

const productService = new ProductService();
const brandService = new BrandService();
const variantService = new VariantService();
const router = useRouter();
const role = computed(() => localStorage.getItem("role"));

const hasVariants = ref(false);
const variants = ref([]);
const addVariantRow = () => {
  variants.value.push({ attrName: '', attrValue: '', price: 0, quantity: 0, image: '' });
};
const removeVariantRow = (index) => {
  variants.value.splice(index, 1);
};

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
    
    payload.has_variants = hasVariants.value;
    payload.image = imagesList.value[0] || "";
    payload.images = imagesList.value;

    const newProduct = await productService.createProduct(payload);

    if (hasVariants.value && variants.value.length > 0) {
      const variantPromises = variants.value.map(v => {
        return variantService.createVariant({
          product_id: newProduct._id || newProduct.id,
          attributes: [{ name: v.attrName, value: v.attrValue }],
          price: v.price,
          quantity: v.quantity,
          image: v.image
        });
      });
      await Promise.all(variantPromises);
    }

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

          <!-- Advanced Image Manager -->
          <div class="md:col-span-2 p-6 border border-slate-200 rounded-2xl bg-slate-50 space-y-4 text-left">
            <label class="label font-bold text-slate-700 text-sm">🖼️ Quản lý hình ảnh sản phẩm</label>
            
            <div class="join w-full">
              <input v-model="newImageUrl" type="text" placeholder="Dán URL hình ảnh vào đây..." class="input input-bordered join-item w-full input-sm" />
              <button type="button" @click="addImageUrl" class="btn btn-sm btn-primary join-item">Thêm URL</button>
            </div>

            <div 
              @dragover.prevent="isDragging = true" 
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              :class="isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 bg-white'"
              class="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:border-primary transition"
              @click="$refs.fileInput.click()"
            >
              <input type="file" ref="fileInput" class="hidden" multiple accept="image/*" @change="handleFileSelect" />
              <span class="text-2xl">📥</span>
              <p class="text-xs text-slate-500 mt-2 font-semibold">Kéo thả hình ảnh vào đây hoặc nhấp để tải lên</p>
              <p class="text-[10px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, GIF</p>
            </div>

            <div v-if="imagesList.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div 
                v-for="(imgUrl, idx) in imagesList" 
                :key="idx" 
                class="group relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-sm"
              >
                <img :src="imgUrl" class="w-full h-full object-cover" />
                
                <span v-if="idx === 0" class="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                  ẢNH BÌA
                </span>

                <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                  <button type="button" @click="removeImage(idx)" class="btn btn-xs btn-circle btn-error self-end text-white font-bold">✕</button>
                  <div class="flex justify-between items-center gap-1">
                    <div class="flex gap-1">
                      <button type="button" :disabled="idx === 0" @click="moveImage(idx, -1)" class="btn btn-xs btn-square bg-white text-slate-800 border-none disabled:opacity-40">◀</button>
                      <button type="button" :disabled="idx === imagesList.length - 1" @click="moveImage(idx, 1)" class="btn btn-xs btn-square bg-white text-slate-800 border-none disabled:opacity-40">▶</button>
                    </div>
                    <button v-if="idx !== 0" type="button" @click="makeCover(idx)" class="btn btn-xs btn-success text-white font-extrabold text-[9px]">Đặt Bìa</button>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-slate-400 text-center py-2 font-medium">Chưa có hình ảnh nào được tải lên cho sản phẩm này.</p>
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

          <!-- Variants Config -->
          <div class="md:col-span-2 mt-4 p-6 border border-emerald-500/20 rounded-2xl bg-emerald-50/30 flex flex-col gap-4">
            <label class="label cursor-pointer justify-start gap-4 p-0">
              <input type="checkbox" v-model="hasVariants" class="toggle toggle-success" />
              <span class="label-text font-bold text-emerald-700 text-lg flex items-center gap-2">
                📦 Sản phẩm có nhiều phân loại (Thuộc tính nâng cao)
              </span>
            </label>

            <div v-if="hasVariants" class="space-y-4 animate-in fade-in duration-300">
              <p class="text-sm text-emerald-600">Thêm các biến thể (ví dụ: Màu Đỏ, Size M) với giá và số lượng riêng biệt.</p>
              
              <div class="overflow-x-auto">
                <table class="table w-full">
                  <thead>
                    <tr class="bg-emerald-100/50">
                      <th>Tên Thuộc Tính</th>
                      <th>Giá Trị</th>
                      <th>Giá Bán</th>
                      <th>Tồn Kho</th>
                      <th>Link Hình Ảnh (tuỳ chọn)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(v, idx) in variants" :key="idx">
                      <td><input v-model="v.attrName" placeholder="VD: Màu sắc" class="input input-sm input-bordered w-full" /></td>
                      <td><input v-model="v.attrValue" placeholder="VD: Đỏ" class="input input-sm input-bordered w-full" /></td>
                      <td><input v-model="v.price" type="number" placeholder="Giá" class="input input-sm input-bordered w-24" /></td>
                      <td><input v-model="v.quantity" type="number" placeholder="Kho" class="input input-sm input-bordered w-20" /></td>
                      <td><input v-model="v.image" placeholder="URL hình ảnh" class="input input-sm input-bordered w-full" /></td>
                      <td>
                        <button type="button" @click="removeVariantRow(idx)" class="btn btn-sm btn-ghost text-red-500">✕</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <button type="button" @click="addVariantRow" class="btn btn-sm btn-outline btn-success">
                + Thêm phân loại
              </button>
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