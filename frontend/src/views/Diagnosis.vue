<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import ProductCard from "../components/ProductCard.vue";
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { push } from "notivue";
import ProductService from "../services/product.service";

const route = useRoute();
const productService = new ProductService();
const imageFile = ref(null);
const previewUrl = ref(null);
const isAnalyzing = ref(false);
const diagnosisResult = ref(null);
const recommendedProducts = ref([]);

const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        imageFile.value = file;
        previewUrl.value = URL.createObjectURL(file);
        diagnosisResult.value = null;
        recommendedProducts.value = [];
    }
};

const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const analyzeSkin = async () => {
    if (!imageFile.value) {
        push.error("Vui lòng tải lên ảnh vùng da cần kiểm tra");
        return;
    }

    isAnalyzing.value = true;
    
    // Simulate AI analysis delay
    setTimeout(async () => {
        // Mock results
        const mockResults = [
            { result: "Da mụn trứng cá", pathology: "mụn", skin_type: "da dầu" },
            { result: "Da khô thiếu nước", pathology: "khô da", skin_type: "da khô" },
            { result: "Da bị nám, tàn nhang", pathology: "nám", skin_type: "mọi loại da" },
            { result: "Da nhạy cảm, mẩn đỏ", pathology: "mẩn đỏ", skin_type: "da nhạy cảm" }
        ];
        
        const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
        diagnosisResult.value = randomResult;
        
        try {
            const allProducts = await productService.getAllProducts();
            // Filter products that match the pathology or skin type
            recommendedProducts.value = allProducts.filter(p => 
                (p.pathology && p.pathology.includes(randomResult.pathology)) || 
                (p.skin_type && p.skin_type.includes(randomResult.skin_type))
            ).slice(0, 4);
            
            push.success("Phân tích thành công!");
        } catch (error) {
            console.error(error);
            push.error("Lỗi khi tải gợi ý sản phẩm");
        } finally {
            isAnalyzing.value = false;
        }
    }, 3000);
};

const resetDiagnosis = () => {
    imageFile.value = null;
    previewUrl.value = null;
    diagnosisResult.value = null;
    recommendedProducts.value = [];
    sessionStorage.removeItem('temp_diagnosis_img');
};

onMounted(() => {
    if (route.query.autostart === 'true') {
        const base64Img = sessionStorage.getItem('temp_diagnosis_img');
        if (base64Img) {
            try {
                const file = dataURLtoFile(base64Img, "temp_diagnosis.jpg");
                imageFile.value = file;
                previewUrl.value = URL.createObjectURL(file);
                analyzeSkin();
            } catch (err) {
                console.error("Lỗi parse base64 ảnh:", err);
            }
        }
    }
});
</script>

<template>
    <div class="flex flex-col min-h-screen bg-gray-50">
        <Header />
        
        <main class="flex-grow container mx-auto px-4 py-12">
            <div class="max-w-4xl mx-auto">
                <div class="text-center mb-12">
                    <h1 class="text-4xl font-extrabold text-gray-900 mb-4">Chuẩn đoán da AI</h1>
                    <p class="text-lg text-gray-600">Tải ảnh vùng da của bạn để nhận kết quả phân tích và gợi ý sản phẩm phù hợp.</p>
                </div>

                <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div class="p-8 md:p-12">
                        <div v-if="!diagnosisResult && !isAnalyzing" class="flex flex-col items-center">
                            <div class="w-full max-w-lg">
                                <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-80 border-2 border-gray-300 border-dashed rounded-3xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-300">
                                    <div v-if="!previewUrl" class="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg class="w-16 h-16 mb-4 text-primary opacity-60" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                        </svg>
                                        <p class="mb-2 text-xl font-semibold text-gray-700">Chọn ảnh hoặc kéo thả</p>
                                        <p class="text-sm text-gray-500">PNG, JPG hoặc JPEG (Tối đa 10MB)</p>
                                    </div>
                                    <img v-else :src="previewUrl" class="h-full w-full object-contain rounded-2xl p-2" />
                                    <input id="dropzone-file" type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
                                </label>
                            </div>
                            
                            <div class="mt-8 flex gap-4">
                                <button v-if="previewUrl" @click="analyzeSkin" class="btn btn-primary btn-lg rounded-full px-12 shadow-lg shadow-primary/30 transform hover:scale-105 transition-all">
                                    Bắt đầu phân tích
                                </button>
                                <button v-if="previewUrl" @click="resetDiagnosis" class="btn btn-ghost btn-lg rounded-full px-8">
                                    Chọn lại
                                </button>
                            </div>
                        </div>

                        <!-- Analyzing State -->
                        <div v-if="isAnalyzing" class="flex flex-col items-center py-12">
                            <div class="relative w-48 h-48 mb-8">
                                <div class="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                                <div class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="text-4xl">🔬</span>
                                </div>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 animate-pulse">Đang phân tích dữ liệu da...</h2>
                            <p class="text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
                        </div>

                        <!-- Result State -->
                        <div v-if="diagnosisResult && !isAnalyzing" class="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div class="flex flex-col md:flex-row gap-8 items-center bg-primary/5 p-8 rounded-3xl border border-primary/10">
                                <div class="w-48 h-48 shrink-0">
                                    <img :src="previewUrl" class="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white" />
                                </div>
                                <div>
                                    <div class="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary font-bold text-xs uppercase tracking-wider mb-2">Kết quả phân tích</div>
                                    <h3 class="text-3xl font-bold text-gray-900 mb-2">{{ diagnosisResult.result }}</h3>
                                    <div class="flex flex-wrap gap-2 mb-4">
                                        <span class="badge badge-outline border-primary/30 text-primary">{{ diagnosisResult.skin_type }}</span>
                                        <span class="badge badge-outline border-secondary/30 text-secondary">{{ diagnosisResult.pathology }}</span>
                                    </div>
                                    <p class="text-gray-600 leading-relaxed">
                                        Dựa trên hình ảnh cung cấp, AI của chúng tôi nhận thấy da bạn có dấu hiệu của <strong>{{ diagnosisResult.pathology }}</strong>. 
                                        Dưới đây là các sản phẩm được tối ưu hóa cho tình trạng da của bạn.
                                    </p>
                                    <button @click="resetDiagnosis" class="mt-6 text-primary font-bold flex items-center gap-2 hover:underline">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                                        </svg>
                                        Phân tích ảnh khác
                                    </button>
                                </div>
                            </div>

                            <div v-if="recommendedProducts.length > 0">
                                <div class="flex items-center justify-between mb-6">
                                    <h4 class="text-2xl font-bold text-gray-900">Sản phẩm gợi ý cho bạn</h4>
                                    <RouterLink to="/products" class="text-primary font-medium hover:underline">Xem tất cả</RouterLink>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <ProductCard v-for="product in recommendedProducts" :key="product._id" :product="product" />
                                </div>
                            </div>
                            <div v-else class="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p class="text-gray-500">Rất tiếc, hiện tại không có sản phẩm gợi ý nào phù hợp.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <Footer />
    </div>
</template>

<style scoped>
.animate-in {
    animation: animate-in 0.5s ease-out;
}

@keyframes animate-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
