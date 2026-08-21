<template>
  <div class="max-w-3xl mx-auto py-10 px-4">
    <h1 class="text-3xl font-bold text-center text-primary mb-6">Chẩn đoán bệnh da liễu bằng AI</h1>
    
    <div class="bg-base-200 rounded-lg shadow-lg p-6">
      <p class="text-center mb-6 text-gray-600">
        Tải lên hình ảnh vùng da của bạn để hệ thống AI (ONNX) phân tích và đưa ra chẩn đoán.
      </p>

      <div class="flex flex-col items-center">
        <!-- Khu vực hiển thị ảnh upload -->
        <div class="w-full max-w-sm aspect-square bg-base-100 border-2 border-dashed border-primary rounded-xl flex items-center justify-center overflow-hidden mb-6 relative group cursor-pointer" @click="triggerFileInput">
          <img v-if="imageUrl" :src="imageUrl" class="w-full h-full object-cover" alt="Uploaded skin image" />
          <div v-else class="text-center p-6 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Nhấp để tải ảnh lên</p>
          </div>
          
          <!-- Hover overlay -->
          <div v-if="imageUrl" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-white font-medium">Thay đổi ảnh</span>
          </div>
        </div>

        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          accept="image/*" 
          @change="onFileSelected" 
        />

        <!-- Button phân tích -->
        <button 
          @click="analyzeImage" 
          class="btn btn-primary w-full max-w-sm text-lg text-white"
          :disabled="!selectedFile || isAnalyzing"
        >
          <span v-if="isAnalyzing" class="loading loading-spinner"></span>
          {{ isAnalyzing ? 'Đang chạy mô hình AI...' : 'Phân tích hình ảnh' }}
        </button>
      </div>
      
      <!-- Kết quả -->
      <div v-if="diseaseResult" class="mt-8 border-t border-base-300 pt-6">
        <h2 class="text-2xl font-semibold mb-6 text-center text-primary">Kết quả phân tích AI</h2>
        
        <div class="bg-white p-6 rounded-xl shadow-md border border-base-200">
          <div class="flex flex-col md:flex-row items-start gap-6">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-4xl">🔬</span>
                <h3 class="text-xl font-bold text-gray-800">{{ diseaseResult.vnName }} <span class="text-sm font-normal text-gray-500">({{ diseaseResult.enName }})</span></h3>
              </div>
              <p class="text-gray-600 mb-4">{{ diseaseResult.description }}</p>
              
              <div class="mt-4">
                <h4 class="font-semibold text-lg text-emerald-600 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Gợi ý thành phần thuốc/Điều trị
                </h4>
                <ul class="list-disc pl-5 space-y-1 text-gray-700">
                  <li v-for="(treatment, index) in diseaseResult.treatments" :key="index">
                    {{ treatment }}
                  </li>
                </ul>
              </div>
            </div>
            
            <div class="w-full md:w-48 bg-base-100 rounded-lg p-4 text-center">
              <p class="text-sm text-gray-500 mb-1">Độ tin cậy</p>
              <div class="radial-progress text-primary" :style="`--value:${diseaseResult.confidence}; --size:6rem; --thickness: 0.5rem;`">
                {{ diseaseResult.confidence }}%
              </div>
            </div>
          </div>
        </div>
        
        <p class="text-sm text-warning mt-6 text-center font-medium bg-orange-50 p-3 rounded-lg border border-orange-100">
          ⚠️ Lưu ý: Kết quả phân tích AI và gợi ý thuốc chỉ mang tính chất tham khảo bước đầu. Vui lòng tham vấn ý kiến bác sĩ da liễu trước khi sử dụng bất kỳ loại thuốc nào.
        </p>
      </div>

      <div v-if="errorMessage" class="mt-4 alert alert-error shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span class="text-white">{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const fileInput = ref(null);
const selectedFile = ref(null);
const imageUrl = ref(null);
const isAnalyzing = ref(false);
const result = ref(null);
const diseaseResult = ref(null);
const predictions = ref([]);
const errorMessage = ref(null);

// Danh sách 10 bệnh từ mô hình AI (Cần đảm bảo đúng thứ tự index 0->9 lúc train)
const diseasesList = [
  // 0: Eczema
  {
    enName: "Eczema",
    vnName: "Chàm (Viêm da cơ địa)",
    description: "Viêm da gây đỏ, ngứa, da khô nứt, thường do dị ứng hoặc yếu tố di truyền.",
    treatments: ["Kem dưỡng ẩm (Ceramides, Urea)", "Corticosteroid bôi tại chỗ (Hydrocortisone)", "Thuốc ức chế calcineurin (Tacrolimus)", "Thuốc kháng Histamine (giảm ngứa)"]
  },
  // 1: Warts Molluscum and other Viral Infections
  {
    enName: "Warts Molluscum",
    vnName: "Mụn cóc và u mềm lây",
    description: "Tổn thương do virus HPV hoặc Molluscum contagiosum, lây lan nhanh, có thể gây ngứa.",
    treatments: ["Axit Salicylic (nồng độ cao)", "Imiquimod cream", "Đốt điện, laser hoặc áp lạnh bằng nitơ lỏng"]
  },
  // 2: Melanoma
  {
    enName: "Melanoma",
    vnName: "U hắc tố",
    description: "U ác tính xuất phát từ tế bào melanocyt, thường xuất hiện dưới dạng đốm bất thường, có nguy cơ di căn cao.",
    treatments: ["Cắt bỏ ngoại khoa", "Immunotherapy (Pembrolizumab)", "Điều trị tia X (Radiotherapy)", "Phẫu thuật cắt bỏ rộng"]
  },
  // 3: Atopic Dermatitis
  {
    enName: "Atopic Dermatitis",
    vnName: "Dị ứng da",
    description: "Bệnh da mạn tính gây khô, ngứa, phát ban, thường xuất hiện ở trẻ em và người lớn.",
    treatments: ["Kem dưỡng ẩm chuyên sâu", "Corticosteroid nhẹ", "Calcineurin inhibitor (Tacrolimus)", "Thuốc kháng Histamine"]
  },
  // 4: Basal Cell Carcinoma (BCC)
  {
    enName: "Basal Cell Carcinoma",
    vnName: "U tế bào đáy (BCC)",
    description: "U lành tính nhưng có thể xâm lấn da, thường xuất hiện ở vùng da tiếp xúc nhiều với ánh nắng.",
    treatments: ["Phẫu thuật cắt bỏ", "Liệu pháp ánh sáng (Photodynamic therapy)", "Curettage và điện chuẩn", "Mohs surgery nếu cần"]
  },
  // 5: Melanocytic Nevi (NV)
  {
    enName: "Melanocytic Nevi",
    vnName: "U nhú melanin (NV)",
    description: "U lành tính xuất hiện do tăng sinh melanocyt, thường không cần điều trị nếu không bất thường.",
    treatments: ["Theo dõi định kỳ", "Cắt bỏ nếu có dấu hiệu bất thường"]
  },
  // 6: Benign Keratosis-like Lesions (BKL)
  {
    enName: "Benign Keratosis-like Lesions",
    vnName: "U hạt sừng",
    description: "Các tổn thương da lành tính tương tự mụn cám, thường do tiếp xúc ánh nắng lâu năm.",
    treatments: ["Kem Fluorouracil (5-FU)", "Kem Imiquimod", "Đốt điện hoặc laser", "Không can thiệp nếu không gây lo ngại"]
  },
  // 7: Psoriasis pictures Lichen Planus and related diseases
  {
    enName: "Psoriasis",
    vnName: "Vảy nến",
    description: "Bệnh tự miễn gây các mảng da đỏ, dày, phủ vảy trắng bạc.",
    treatments: ["Corticosteroid mạnh", "Vitamin D dẫn xuất (Calcipotriene)", "Salicylic Acid (loại bỏ vảy)", "Kem dưỡng ẩm"]
  },
  // 8: Seborrheic Keratoses and other Benign Tumors
  {
    enName: "Seborrheic Keratoses",
    vnName: "U hạt bã nhờn",
    description: "Mụn lành tính phát triển trên da cổ, lưng, thường không gây nguy hiểm.",
    treatments: ["Cắt bỏ bằng laser", "Điều trị đáy bằng đốt điện", "Theo dõi nếu không gây khó chịu"]
  },
  // 9: Tinea Ringworm Candidiasis and other Fungal Infections
  {
    enName: "Tinea Ringworm",
    vnName: "Nấm da (Hắc lào)",
    description: "Nấm da gây vòng tròn đỏ, viền gờ, ngứa, thường ở vùng da ẩm.",
    treatments: ["Kem chống nấm (Clotrimazole, Ketoconazole)", "Terbinafine cream", "Giữ vùng da khô ráo, sạch sẽ"]
  }
];

const triggerFileInput = () => {
  fileInput.value.click();
};

const onFileSelected = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  selectedFile.value = file;
  imageUrl.value = URL.createObjectURL(file);
  result.value = null;
  diseaseResult.value = null;
  errorMessage.value = null;
};

const analyzeImage = async () => {
  if (!selectedFile.value) return;

  isAnalyzing.value = true;
  errorMessage.value = null;
  result.value = null;
  diseaseResult.value = null;

  try {
    const formData = new FormData();
    formData.append('image', selectedFile.value);

    // Lưu ý: Cần chắc chắn endpoint Backend đang chạy cổng 3000
    const response = await axios.post('http://localhost:3000/api/ai/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const probabilitiesArray = response.data.data; // Đây là mảng các số dạng [0.1, 0.05, 0.8, ...]
    
    // Tìm index có xác suất cao nhất
    let maxIndex = 0;
    let maxProbability = probabilitiesArray[0];
    
    for (let i = 1; i < probabilitiesArray.length; i++) {
      if (probabilitiesArray[i] > maxProbability) {
        maxProbability = probabilitiesArray[i];
        maxIndex = i;
      }
    }
    
    // Ánh xạ sang thông tin bệnh
    if (maxIndex >= 0 && maxIndex < diseasesList.length) {
      diseaseResult.value = {
        ...diseasesList[maxIndex],
        confidence: Math.round(maxProbability * 100)
      };
    } else {
      errorMessage.value = "Model AI trả về kết quả không khớp với danh sách bệnh. Vui lòng kiểm tra lại class index.";
    }

  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi phân tích hình ảnh.';
    console.error(error);
  } finally {
    isAnalyzing.value = false;
  }
};
</script>
