<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import ProductCard from "../components/ProductCard.vue";
import { ref, onMounted } from "vue";
// Camera refs
import { onBeforeUnmount } from "vue";

import { useRoute } from "vue-router";
import { push } from "notivue";
import ProductService from "../services/product.service";
import axios from "axios";

import ContactService from "../services/contact.service";

const route = useRoute();
const productService = new ProductService();
const contactService = new ContactService();

const imageFile = ref(null);
const previewUrl = ref(null);
const isAnalyzing = ref(false);
const diagnosisResult = ref(null);
const allPredictions = ref([]);
const recommendedProducts = ref([]);
const isPregnant = ref(false);
const isChild = ref(false);
const selectedSkinType = ref("da nhạy cảm");

// Camera related state
const showCameraModal = ref(false);
const videoStream = ref(null);
const videoRef = ref(null);
const canvasRef = ref(null);

// Customer Care & Consultation State
const showConsultModal = ref(false);
const showChatModal = ref(false);
const isSendingContact = ref(false);

const contactName = ref("");
const contactPhone = ref("");
const contactSkinCondition = ref("Mụn & Thâm mụn");
const contactMessage = ref("");

const handleSendConsultation = async () => {
  if (!contactName.value.trim() || !contactPhone.value.trim() || !contactMessage.value.trim()) {
    push.warning("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Lời nhắn!");
    return;
  }
  try {
    isSendingContact.value = true;
    await contactService.createContact({
      ho_ten: contactName.value.trim(),
      so_dien_thoai: contactPhone.value.trim(),
      tinh_trang_da: contactSkinCondition.value,
      tieu_de: `Đăng ký tư vấn da liễu: ${contactSkinCondition.value}`,
      noi_dung: contactMessage.value.trim()
    });
    push.success("Gửi yêu cầu thành công! Dược sĩ chuyên khoa sẽ liên hệ tư vấn trong vòng 15 phút.");
    showConsultModal.value = false;
    contactMessage.value = "";
  } catch (err) {
    console.error("Lỗi gửi tư vấn:", err);
    push.error("Không thể gửi yêu cầu tư vấn. Vui lòng thử lại!");
  } finally {
    isSendingContact.value = false;
  }
};

// ===================================================================
// 10 bệnh da liễu từ model ONNX best.onnx (đúng thứ tự index 0->9)
// iconColor: màu nền icon  | iconName: tên Google Material Symbol
// ===================================================================
const diseasesList = [
  // 0: Eczema
  {
    enName: "Eczema",
    vnName: "Chàm (Viêm da cơ địa)",
    pathology: "chàm",
    skin_type: "da nhạy cảm",
    description: "Viêm da gây đỏ, ngứa, da khô nứt, thường do dị ứng hoặc yếu tố di truyền.",
    iconColor: "#EF4444", iconBg: "#FEF2F2", iconName: "dermatology",
    treatments: ["Kem dưỡng ẩm (Ceramides, Urea)", "Corticosteroid bôi tại chỗ (Hydrocortisone)", "Thuốc ức chế calcineurin (Tacrolimus)", "Thuốc kháng Histamine (giảm ngứa)"]
  },
  // 1: Warts Molluscum
  {
    enName: "Warts Molluscum",
    vnName: "Mụn cóc và u mềm lây",
    pathology: "mụn cóc",
    skin_type: "mọi loại da",
    description: "Tổn thương do virus HPV hoặc Molluscum contagiosum, lây lan nhanh, có thể gây ngứa.",
    iconColor: "#8B5CF6", iconBg: "#F5F3FF", iconName: "coronavirus",
    treatments: ["Axit Salicylic (nồng độ cao)", "Imiquimod cream", "Đốt điện, laser hoặc áp lạnh bằng nitơ lỏng"]
  },
  // 2: Melanoma
  {
    enName: "Melanoma",
    vnName: "U hắc tố ác tính",
    pathology: "melanoma",
    skin_type: "mọi loại da",
    description: "U ác tính xuất phát từ tế bào melanocyt, thường xuất hiện dưới dạng đốm bất thường, có nguy cơ di căn cao.",
    iconColor: "#DC2626", iconBg: "#FFF1F2", iconName: "warning",
    treatments: ["Cắt bỏ ngoại khoa", "Immunotherapy (Pembrolizumab)", "Điều trị tia X (Radiotherapy)", "Phẫu thuật cắt bỏ rộng"]
  },
  // 3: Atopic Dermatitis
  {
    enName: "Atopic Dermatitis",
    vnName: "Viêm da dị ứng",
    pathology: "viêm da",
    skin_type: "da nhạy cảm",
    description: "Bệnh da mạn tính gây khô, ngứa, phát ban, thường xuất hiện ở trẻ em và người lớn.",
    iconColor: "#F59E0B", iconBg: "#FFFBEB", iconName: "thermometer",
    treatments: ["Kem dưỡng ẩm chuyên sâu", "Corticosteroid nhẹ", "Calcineurin inhibitor (Tacrolimus)", "Thuốc kháng Histamine"]
  },
  // 4: Basal Cell Carcinoma (BCC)
  {
    enName: "Basal Cell Carcinoma",
    vnName: "Ung thư tế bào đáy (BCC)",
    pathology: "ung thư da",
    skin_type: "mọi loại da",
    description: "U lành tính nhưng có thể xâm lấn da, thường xuất hiện ở vùng da tiếp xúc nhiều với ánh nắng.",
    iconColor: "#0EA5E9", iconBg: "#F0F9FF", iconName: "biotech",
    treatments: ["Phẫu thuật cắt bỏ", "Liệu pháp ánh sáng (Photodynamic therapy)", "Curettage và điện chuẩn", "Mohs surgery nếu cần"]
  },
  // 5: Melanocytic Nevi (NV)
  {
    enName: "Melanocytic Nevi",
    vnName: "Nốt ruồi / U sắc tố",
    pathology: "nốt ruồi",
    skin_type: "mọi loại da",
    description: "U lành tính xuất hiện do tăng sinh melanocyt, thường không cần điều trị nếu không bất thường.",
    iconColor: "#64748B", iconBg: "#F8FAFC", iconName: "circle",
    treatments: ["Theo dõi định kỳ", "Cắt bỏ nếu có dấu hiệu bất thường"]
  },
  // 6: Benign Keratosis-like Lesions (BKL)
  {
    enName: "Benign Keratosis-like Lesions",
    vnName: "Tổn thương sừng lành tính",
    pathology: "sừng da",
    skin_type: "da lão hóa",
    description: "Các tổn thương da lành tính tương tự mụn cám, thường do tiếp xúc ánh nắng lâu năm.",
    iconColor: "#B45309", iconBg: "#FFF7ED", iconName: "wb_sunny",
    treatments: ["Kem Fluorouracil (5-FU)", "Kem Imiquimod", "Đốt điện hoặc laser", "Không can thiệp nếu không gây lo ngại"]
  },
  // 7: Psoriasis
  {
    enName: "Psoriasis",
    vnName: "Vảy nến",
    pathology: "vảy nến",
    skin_type: "mọi loại da",
    description: "Bệnh tự miễn gây các mảng da đỏ, dày, phủ vảy trắng bạc.",
    iconColor: "#10B981", iconBg: "#F0FDF4", iconName: "healing",
    treatments: ["Corticosteroid mạnh", "Vitamin D dẫn xuất (Calcipotriene)", "Salicylic Acid (loại bỏ vảy)", "Kem dưỡng ẩm"]
  },
  // 8: Seborrheic Keratoses
  {
    enName: "Seborrheic Keratoses",
    vnName: "U hạt bã nhờn",
    pathology: "u hạt",
    skin_type: "da dầu",
    description: "Mụn lành tính phát triển trên da cổ, lưng, thường không gây nguy hiểm.",
    iconColor: "#EAB308", iconBg: "#FEFCE8", iconName: "grain",
    treatments: ["Cắt bỏ bằng laser", "Điều trị bằng đốt điện", "Theo dõi nếu không gây khó chịu"]
  },
  // 9: Tinea Ringworm
  {
    enName: "Tinea Ringworm",
    vnName: "Nấm da / Hắc lào",
    pathology: "nấm da",
    skin_type: "mọi loại da",
    description: "Nhiễm trùng nấm gây phát ban dạng vòng, ngứa, da bong tróc.",
    iconColor: "#3B82F6", iconBg: "#EFF6FF", iconName: "blur_circular",
    treatments: ["Kem chống nấm (Clotrimazole, Miconazole)", "Fluconazole uống (nặng)", "Giữ da khô ráo, sạch sẽ", "Terbinafine (Lamisil)"]
  }
];

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    diagnosisResult.value = null;
    allPredictions.value = [];
    recommendedProducts.value = [];
  }
};

// ---------- Camera Functions ----------
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    videoStream.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      videoRef.value.play();
    }
  } catch (err) {
    console.error("Camera error:", err);
    push.error(`Không thể truy cập camera: ${err.message}`);
  }
};

const stopCamera = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(t => t.stop());
    videoStream.value = null;
  }
};

const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return;
  const video = videoRef.value;
  const canvas = canvasRef.value;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => {
    const file = new File([blob], "camera_capture.jpg", { type: blob.type });
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    diagnosisResult.value = null;
    allPredictions.value = [];
    recommendedProducts.value = [];
    // close modal and stop camera
    showCameraModal.value = false;
    stopCamera();
  }, 'image/jpeg');
};

onBeforeUnmount(() => {
  stopCamera();
});

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
  diagnosisResult.value = null;
  allPredictions.value = [];
  recommendedProducts.value = [];

  try {
    const formData = new FormData();
    formData.append('image', imageFile.value);

    const response = await axios.post('/api/ai/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const rawScores = response.data.data;

    const scoredDiseases = rawScores.map((score, idx) => ({
      ...diseasesList[idx],
      confidence: Math.round(score * 100),
      rawScore: score
    }));

    scoredDiseases.sort((a, b) => b.rawScore - a.rawScore);
    allPredictions.value = scoredDiseases;
    diagnosisResult.value = scoredDiseases[0];

    localStorage.setItem('latest_ai_diagnosis', JSON.stringify({
      condition: scoredDiseases[0].vnName || scoredDiseases[0].pathology || scoredDiseases[0].enName,
      confidence: scoredDiseases[0].rawScore
    }));

    await updateRecommendations();
    push.success("Phân tích thành công!");

  } catch (error) {
    console.error("Lỗi phân tích AI:", error);
    push.error(`Lỗi khi phân tích ảnh: ${error?.response?.data?.message || error.message}`);
  } finally {
    isAnalyzing.value = false;
  }
};

const updateRecommendations = async () => {
  if (!diagnosisResult.value) return;
  const mainDisease = diagnosisResult.value;
  try {
    const recRes = await axios.post('/api/recommendations/predict', {
      disease: mainDisease.enName || mainDisease.pathology || mainDisease.vnName,
      skinType: selectedSkinType.value || mainDisease.skin_type || 'da nhạy cảm',
      isPregnant: isPregnant.value,
      isChild: isChild.value,
      limit: 8
    });

    if (recRes.data?.data?.recommendations && recRes.data.data.recommendations.length > 0) {
      recommendedProducts.value = recRes.data.data.recommendations.map(r => ({
        ...r,
        _id: r._id || r.id,
        title: r.title || r.name,
        name: r.name || r.title,
        price: r.price,
        quantity: (r.quantity !== undefined && r.quantity !== null && r.quantity > 0) ? r.quantity : 50,
        image: r.image,
        brand_id: r.brand_id || (r.brand ? { name: r.brand } : null),
        category: r.category,
        recommendation_score: r.recommendation_score,
        recommendation_reason: r.recommendation_reason,
        safety_tags: r.safety_tags
      }));
    } else {
      const allProducts = await productService.getAllProducts();
      recommendedProducts.value = allProducts.filter(p =>
        (p.pathology && p.pathology.includes(mainDisease.pathology)) ||
        (p.skin_type && p.skin_type.includes(mainDisease.skin_type))
      ).slice(0, 4);
    }
  } catch (productErr) {
    console.warn("Không lấy được sản phẩm từ AI Engine, dùng fallback:", productErr);
    try {
      const allProducts = await productService.getAllProducts();
      recommendedProducts.value = allProducts.slice(0, 4);
    } catch (e) {
      console.error("Lỗi lấy sản phẩm:", e);
    }
  }
};

const resetDiagnosis = () => {
  imageFile.value = null;
  previewUrl.value = null;
  diagnosisResult.value = null;
  allPredictions.value = [];
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
    <!-- Google Material Symbols font -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

    <Header />

    <main class="flex-grow container mx-auto px-4 py-12">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <!-- Google-style page header with Material icon -->
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary" style="font-size:28px; font-variation-settings:'FILL' 1;">dermatology</span>
            </div>
            <h1 class="text-4xl font-extrabold text-gray-900">Chẩn đoán da AI</h1>
          </div>
          <p class="text-lg text-gray-500">Tải ảnh vùng da của bạn để nhận kết quả phân tích từ mô hình AI (ONNX) và gợi ý sản phẩm phù hợp.</p>
        </div>

        <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div class="p-8 md:p-12">

            <!-- Upload State -->
            <div v-if="!diagnosisResult && !isAnalyzing" class="flex flex-col items-center">
              <div class="w-full max-w-lg">
                <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-80 border-2 border-gray-300 border-dashed rounded-3xl cursor-pointer bg-gray-50 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300">
                  <div v-if="!previewUrl" class="flex flex-col items-center justify-center pt-5 pb-6 gap-3">
                    <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <span class="material-symbols-outlined text-primary" style="font-size:40px;">add_photo_alternate</span>
                    </div>
                    <p class="text-xl font-semibold text-gray-700">Chọn ảnh hoặc kéo thả</p>
                    <p class="text-sm text-gray-400">PNG, JPG hoặc JPEG (Tối đa 10MB)</p>
                    <button type="button" @click="showCameraModal = true; startCamera()" class="mt-3 btn btn-primary btn-sm rounded-full px-4">
                      <span class="material-symbols-outlined" style="font-size:20px;">camera_alt</span>
                      Dùng Camera
                    </button>
                  </div>
                  <img v-else :src="previewUrl" class="h-full w-full object-contain rounded-2xl p-2" />
                  <input id="dropzone-file" type="file" class="hidden" accept="image/*" @change="handleImageUpload" />
                </label>
              </div>

              <!-- Tùy chọn Thể trạng Y tế cá nhân -->
              <div class="w-full max-w-lg mt-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p class="text-xs font-bold uppercase tracking-wider text-[#006B57] mb-3 flex items-center gap-1.5">
                  <span class="material-symbols-outlined" style="font-size:16px;">health_and_safety</span>
                  Thông tin thể trạng (để AI loại trừ sản phẩm chống chỉ định)
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <label class="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-gray-200 hover:border-primary/50 transition">
                    <input type="checkbox" v-model="isPregnant" class="checkbox checkbox-primary checkbox-sm" />
                    <span class="font-medium text-gray-700">🤰 Đang mang thai / Cho con bú</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-xl border border-gray-200 hover:border-primary/50 transition">
                    <input type="checkbox" v-model="isChild" class="checkbox checkbox-primary checkbox-sm" />
                    <span class="font-medium text-gray-700">👶 Dưới 16 tuổi / Trẻ em</span>
                  </label>
                </div>
              </div>

              <div class="mt-6 flex gap-4">
                <button v-if="previewUrl" @click="analyzeSkin"
                  class="flex items-center gap-2 btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/30 transform hover:scale-105 transition-all">
                  <span class="material-symbols-outlined" style="font-size:20px; font-variation-settings:'FILL' 1;">biotech</span>
                  Bắt đầu phân tích
                </button>
                <button v-if="previewUrl" @click="resetDiagnosis" class="flex items-center gap-2 btn btn-ghost btn-lg rounded-full px-8">
                  <span class="material-symbols-outlined" style="font-size:18px;">restart_alt</span>
                  Chọn lại
                </button>
              </div>
            </div>

            <!-- Analyzing State -->
            <div v-if="isAnalyzing" class="flex flex-col items-center py-12">
              <div class="relative w-40 h-40 mb-8">
                <div class="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary" style="font-size:52px; font-variation-settings:'FILL' 1;">biotech</span>
                </div>
              </div>
              <h2 class="text-2xl font-bold text-gray-800 animate-pulse">Đang chạy mô hình AI (ONNX)...</h2>
              <p class="text-gray-400 mt-2">Vui lòng đợi trong giây lát</p>
            </div>

            <!-- Result State -->
            <div v-if="diagnosisResult && !isAnalyzing" class="space-y-10 animate-in">

              <!-- Kết quả chính -->
              <div class="flex flex-col md:flex-row gap-8 items-start p-8 rounded-3xl border"
                   :style="`background: ${diagnosisResult.iconBg}; border-color: ${diagnosisResult.iconColor}22`">
                <div class="w-44 h-44 shrink-0">
                  <img :src="previewUrl" class="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white" />
                </div>
                <div class="flex-1">
                  <!-- Label badge -->
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                       :style="`background: ${diagnosisResult.iconColor}22; color: ${diagnosisResult.iconColor}`">
                    <span class="material-symbols-outlined" style="font-size:14px; font-variation-settings:'FILL' 1;">verified</span>
                    Kết quả phân tích AI
                  </div>

                  <!-- Disease name with Google-style icon -->
                  <div class="flex items-center gap-3 mb-1">
                    <div class="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                         :style="`background: ${diagnosisResult.iconColor}`">
                      <span class="material-symbols-outlined text-white" style="font-size:24px; font-variation-settings:'FILL' 1;">
                        {{ diagnosisResult.iconName }}
                      </span>
                    </div>
                    <div>
                      <h3 class="text-2xl font-bold text-gray-900 leading-tight">{{ diagnosisResult.vnName }}</h3>
                      <p class="text-sm text-gray-400">{{ diagnosisResult.enName }}</p>
                    </div>
                  </div>

                  <!-- Badges -->
                  <div class="flex flex-wrap gap-2 my-3">
                    <span class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border"
                          :style="`border-color: ${diagnosisResult.iconColor}44; color: ${diagnosisResult.iconColor}; background: white`">
                      <span class="material-symbols-outlined" style="font-size:12px;">category</span>
                      {{ diagnosisResult.skin_type }}
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-200 text-gray-600 bg-white">
                      <span class="material-symbols-outlined" style="font-size:12px;">label</span>
                      {{ diagnosisResult.pathology }}
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500 text-white">
                      <span class="material-symbols-outlined" style="font-size:12px; font-variation-settings:'FILL' 1;">percent</span>
                      Độ tin cậy: {{ diagnosisResult.confidence }}%
                    </span>
                  </div>

                  <p class="text-gray-600 leading-relaxed text-sm mb-4">{{ diagnosisResult.description }}</p>

                  <!-- Gợi ý điều trị -->
                  <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <h4 class="flex items-center gap-2 font-semibold text-sm text-emerald-700 mb-3 uppercase tracking-wide">
                      <span class="material-symbols-outlined" style="font-size:18px; font-variation-settings:'FILL' 1;">medication</span>
                      Gợi ý điều trị / Thành phần thuốc
                    </h4>
                    <ul class="space-y-2">
                      <li v-for="(t, i) in diagnosisResult.treatments" :key="i"
                          class="flex items-start gap-2 text-sm text-gray-700">
                        <span class="material-symbols-outlined text-emerald-500 mt-0.5" style="font-size:16px; font-variation-settings:'FILL' 1;">check_circle</span>
                        {{ t }}
                      </li>
                    </ul>
                  </div>

                  <button @click="resetDiagnosis" class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    <span class="material-symbols-outlined" style="font-size:18px;">refresh</span>
                    Phân tích ảnh khác
                  </button>
                </div>
              </div>

              <!-- Bảng 10 bệnh -->
              <div>
                <h4 class="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                  <span class="material-symbols-outlined text-primary" style="font-size:22px; font-variation-settings:'FILL' 1;">analytics</span>
                  Phân tích chi tiết 10 loại bệnh da
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="(disease, idx) in allPredictions"
                    :key="disease.enName"
                    class="flex items-center gap-4 p-3 rounded-2xl transition-all"
                    :class="idx === 0 ? 'shadow-sm' : 'bg-gray-50'"
                    :style="idx === 0 ? `background: ${disease.iconBg}; border: 1.5px solid ${disease.iconColor}33` : ''"
                  >
                    <!-- Google Material icon per disease -->
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                         :style="`background: ${disease.iconColor}${idx === 0 ? '' : '22'}`">
                      <span class="material-symbols-outlined"
                            :style="`font-size:18px; font-variation-settings:'FILL' 1; color: ${idx === 0 ? 'white' : disease.iconColor}`">
                        {{ disease.iconName }}
                      </span>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-center mb-1">
                        <span class="font-medium text-gray-800 text-sm truncate">{{ disease.vnName }}</span>
                        <span class="font-bold text-sm ml-2" :style="idx === 0 ? `color: ${disease.iconColor}` : 'color: #9CA3AF'">
                          {{ disease.confidence }}%
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          class="h-1.5 rounded-full transition-all duration-700"
                          :style="`width: ${disease.confidence}%; background: ${idx === 0 ? disease.iconColor : '#D1D5DB'}`"
                        ></div>
                      </div>
                    </div>

                    <!-- Top result badge -->
                    <div v-if="idx === 0"
                         class="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white whitespace-nowrap"
                         :style="`background: ${disease.iconColor}`">
                      <span class="material-symbols-outlined" style="font-size:12px; font-variation-settings:'FILL' 1;">star</span>
                      Kết quả
                    </div>
                  </div>
                </div>
              </div>

              <!-- Cảnh báo -->
              <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <span class="material-symbols-outlined text-amber-500 shrink-0 mt-0.5" style="font-size:20px; font-variation-settings:'FILL' 1;">warning</span>
                <p class="text-sm text-amber-700 font-medium">
                  Kết quả phân tích AI và gợi ý thuốc chỉ mang tính chất tham khảo bước đầu. Vui lòng tham vấn ý kiến bác sĩ da liễu trước khi sử dụng bất kỳ loại thuốc nào.
                </p>
              </div>

              <!-- Bộ lọc thể trạng trực tiếp trên trang kết quả -->
              <div class="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-700" style="font-size:20px;">health_and_safety</span>
                    <span class="text-sm font-bold text-emerald-950">Bộ lọc thể trạng y tế:</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-3 text-sm">
                    <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-emerald-200 hover:border-emerald-500 shadow-sm transition">
                      <input type="checkbox" v-model="isPregnant" @change="updateRecommendations" class="checkbox checkbox-primary checkbox-sm" />
                      <span class="font-semibold text-gray-800 text-xs sm:text-sm">🤰 Đang mang thai / Cho con bú</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-emerald-200 hover:border-emerald-500 shadow-sm transition">
                      <input type="checkbox" v-model="isChild" @change="updateRecommendations" class="checkbox checkbox-primary checkbox-sm" />
                      <span class="font-semibold text-gray-800 text-xs sm:text-sm">👶 Dưới 16 tuổi / Trẻ em</span>
                    </label>
                  </div>
                </div>

                <div v-if="isPregnant" class="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200/60 animate-in">
                  <span class="material-symbols-outlined text-emerald-600" style="font-size:16px;">verified_user</span>
                  Đang kích hoạt quy tắc an toàn: Tự động loại trừ Retinoids, BHA liều cao, Hydroquinone khỏi danh sách gợi ý.
                </div>
              </div>

              <!-- Sản phẩm gợi ý -->
              <div v-if="recommendedProducts.length > 0">
                <div class="flex items-center justify-between mb-6">
                  <h4 class="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <span class="material-symbols-outlined text-primary" style="font-size:22px; font-variation-settings:'FILL' 1;">shopping_bag</span>
                    Sản phẩm gợi ý cho bạn
                  </h4>
                  <RouterLink to="/products" class="flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                    Xem tất cả
                    <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span>
                  </RouterLink>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <ProductCard v-for="product in recommendedProducts" :key="product._id" :product="product" />
                </div>
              </div>
              <div v-else class="flex flex-col items-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span class="material-symbols-outlined text-gray-300 mb-2" style="font-size:48px;">inventory_2</span>
                <p class="text-gray-400 text-sm">Hiện tại không có sản phẩm gợi ý phù hợp cho loại bệnh này.</p>
              </div>
</div>
</div>
</div>
</div>
      <!-- SECTION HỖ TRỢ TƯ VẤN VỚI BÁC SĨ & DƯỢC SĨ / STAFF -->
      <section class="w-full bg-[#F7F8F5] py-14 border-t border-b border-[#EAECE6] text-left">
        <div class="w-[92%] max-w-6xl mx-auto">
          <div class="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#DCE8E1] relative overflow-hidden">
            <div class="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none text-emerald-950">
              <span class="material-symbols-outlined" style="font-size: 280px;">medical_services</span>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
              <!-- BÊN TRÁI -->
              <div class="lg:col-span-7 space-y-4">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-[#E8F0EC] rounded-full text-xs font-semibold text-[#006B57]">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C878] opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-[#00C878]"></span>
                  </span>
                  <span>Đội ngũ Dược sĩ & Staff trực tuyến 24/7</span>
                </div>
                
                <div class="space-y-1">
                  <h3 class="text-3xl md:text-[34px] font-bold tracking-tight leading-tight text-[#123C34]">
                    Cần tư vấn chăm sóc da?
                  </h3>
                  <p class="text-base md:text-lg font-semibold text-[#006B57]">
                    Được hỗ trợ bởi đội ngũ chuyên môn
                  </p>
                </div>
                
                <p class="text-sm md:text-[15px] text-[#5F716B] font-normal leading-relaxed max-w-[580px]">
                  Đội ngũ Dược sĩ & Staff SkinMedi AI sẵn sàng hỗ trợ giải đáp kết quả phân tích da, tư vấn sản phẩm phù hợp và hướng dẫn chăm sóc da.
                </p>

                <!-- Hotline list gọn gàng -->
                <div class="flex flex-wrap gap-8 pt-4 border-t border-[#F0F2EC]">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-[#E8F0EC] flex items-center justify-center text-[#006B57]">
                      <span class="material-symbols-outlined text-lg">call</span>
                    </div>
                    <div>
                      <p class="text-[10px] uppercase font-bold text-[#5F716B] tracking-wider">Hotline</p>
                      <a href="tel:0901234567" class="text-sm font-bold text-[#006B57] hover:underline">0901 234 567</a>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-[#F5F5F0] flex items-center justify-center text-[#5F716B]">
                      <span class="material-symbols-outlined text-lg">support_agent</span>
                    </div>
                    <div>
                      <p class="text-[10px] uppercase font-bold text-[#5F716B] tracking-wider">Tổng đài</p>
                      <a href="tel:19006789" class="text-sm font-bold text-[#123C34] hover:underline">1900 6789</a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- BÊN PHẢI -->
              <div class="lg:col-span-5 bg-[#F8F9F6] p-6 md:p-8 rounded-2xl border border-[#EAECE4] flex flex-col gap-4 w-full">
                <p class="text-xs uppercase font-extrabold text-[#5F716B] tracking-widest mb-1">Bạn cần hỗ trợ?</p>

                <!-- CTA 1 - Chính -->
                <button 
                  @click="showChatModal = !showChatModal" 
                  class="w-full text-left bg-[#006B57] hover:bg-[#005544] text-white p-4 rounded-xl shadow-xs transition-all flex items-start gap-3 hover:-translate-y-0.5"
                >
                  <span class="material-symbols-outlined text-xl mt-0.5">chat</span>
                  <div>
                    <p class="font-bold text-sm">Nhắn tin với Staff / Dược sĩ</p>
                    <p class="text-[11px] text-white/80 font-normal mt-0.5">Trao đổi trực tiếp để được hỗ trợ nhanh chóng</p>
                  </div>
                </button>

                <!-- CTA 2 - Phụ -->
                <button 
                  @click="showConsultModal = true" 
                  class="w-full text-left bg-white border border-[#006B57] hover:bg-[#F2F7F5] text-[#006B57] p-4 rounded-xl transition-all flex items-start gap-3 hover:-translate-y-0.5"
                >
                  <span class="material-symbols-outlined text-xl mt-0.5">edit_note</span>
                  <div>
                    <p class="font-bold text-sm text-[#006B57]">Đăng ký tư vấn chuyên sâu</p>
                    <p class="text-[11px] text-[#5F716B] font-normal mt-0.5">Để lại thông tin, chúng tôi sẽ liên hệ lại</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal Đăng ký gọi lại tư vấn -->
      <div v-if="showConsultModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200 text-left relative">
          <button @click="showConsultModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              👨‍⚕️
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-800">Đăng ký tư vấn da liễu</h3>
              <p class="text-xs text-slate-500">Dược sĩ chuyên khoa sẽ liên hệ trực tiếp cho bạn</p>
            </div>
          </div>

          <form @submit.prevent="handleSendConsultation" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Họ và tên <span class="text-red-500">*</span></label>
              <input v-model="contactName" type="text" placeholder="Nguyễn Văn A" class="input input-bordered input-sm w-full rounded-xl" required />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Số điện thoại liên hệ <span class="text-red-500">*</span></label>
              <input v-model="contactPhone" type="text" placeholder="0901234567" class="input input-bordered input-sm w-full rounded-xl" required />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Tình trạng da cần tư vấn</label>
              <select v-model="contactSkinCondition" class="select select-bordered select-sm w-full rounded-xl">
                <option value="Mụn & Thâm mụn">Da Mụn & Thâm mụn</option>
                <option value="Chàm & Viêm da cơ địa">Chàm (Eczema) & Viêm da</option>
                <option value="Da nhạy cảm & Dễ kích ứng">Da Nhạy cảm & Dễ kích ứng</option>
                <option value="Da khô & Vảy nến">Da Khô & Vảy nến</option>
                <option value="Tư vấn sản phẩm & Phác đồ">Tư vấn chọn sản phẩm / Phác đồ</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Lời nhắn cho Dược sĩ <span class="text-red-500">*</span></label>
              <textarea v-model="contactMessage" rows="3" placeholder="Mô tả cụ thể triệu chứng hoặc câu hỏi của bạn..." class="textarea textarea-bordered w-full rounded-xl text-xs" required></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showConsultModal = false" class="btn btn-ghost btn-sm rounded-xl">Hủy</button>
              <button type="submit" :disabled="isSendingContact" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl px-6 font-bold">
                <span v-if="isSendingContact" class="loading loading-spinner loading-xs mr-1"></span>
                🚀 Gửi yêu cầu tư vấn
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Chatbox Staff Modal Widget -->
      <div v-if="showChatModal" class="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in">
        <div class="bg-[#064E3B] text-white p-4 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-base border border-emerald-500">
                💬
              </div>
              <span class="w-3 h-3 bg-emerald-400 border-2 border-[#064E3B] rounded-full absolute bottom-0 right-0"></span>
            </div>
            <div>
              <h4 class="font-bold text-sm">Tư Vấn Dược Sĩ & Staff</h4>
              <p class="text-[10px] text-emerald-200">Đang trực tuyến • Sẵn sàng hỗ trợ</p>
            </div>
          </div>
          <button @click="showChatModal = false" class="text-white/80 hover:text-white font-bold text-lg">✕</button>
        </div>
        <div class="p-4 bg-slate-50 min-h-[240px] max-h-[340px] overflow-y-auto space-y-3">
          <div class="bg-white p-3 rounded-2xl shadow-xs border border-slate-100 text-xs text-slate-700 max-w-[85%] text-left">
            👋 Xin chào! Tôi là Dược sĩ tư vấn tại SkinMedi AI. Bạn cần hỗ trợ kết quả test da hay chọn sản phẩm điều trị phù hợp?
          </div>

          <div class="space-y-2 pt-2">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Gợi ý câu hỏi nhanh:</p>
            <button @click="contactMessage = 'Tư vấn giúp tôi phác đồ điều trị mụn chuẩn y khoa'; showConsultModal = true; showChatModal = false;" class="w-full text-left p-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] rounded-xl text-xs font-semibold border border-emerald-200 transition-all flex items-center justify-between">
              <span>💊 Tư vấn phác đồ điều trị mụn</span>
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
            <button @click="contactMessage = 'Da tôi nhạy cảm dễ mẩn đỏ, nên dùng sản phẩm nào?'; showConsultModal = true; showChatModal = false;" class="w-full text-left p-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] rounded-xl text-xs font-semibold border border-emerald-200 transition-all flex items-center justify-between">
              <span>🌿 Dược mỹ phẩm cho da nhạy cảm</span>
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
            <button @click="contactMessage = 'Tôi muốn gọi điện tư vấn trực tiếp với bác sĩ da liễu'; showConsultModal = true; showChatModal = false;" class="w-full text-left p-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] rounded-xl text-xs font-semibold border border-emerald-200 transition-all flex items-center justify-between">
              <span>📞 Đăng ký gọi lại thoại tư vấn</span>
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
        <div class="p-3 bg-white border-t border-slate-100 flex gap-2">
          <a href="tel:0901234567" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl flex-1 text-xs font-bold">
            📞 Gọi 0901 234 567
          </a>
          <button @click="showConsultModal = true; showChatModal = false;" class="btn btn-outline btn-sm rounded-xl flex-1 text-xs font-bold text-[#064E3B]">
            📝 Gửi Tin Nhắn
          </button>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.animate-in {
  animation: animate-in 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
