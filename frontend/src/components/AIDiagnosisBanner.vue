<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { push } from 'notivue';

const router = useRouter();
const imageFile = ref(null);
const previewUrl = ref(null);
const isDragging = ref(false);
const showCamera = ref(false);
const videoRef = ref(null);
const streamRef = ref(null);

const onDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
};

const onFileSelect = (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
};

const handleFile = (file) => {
  if (!file.type.startsWith('image/')) {
    push.error('Chỉ chấp nhận tập tin hình ảnh!');
    return;
  }
  imageFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  push.success('Đã chọn ảnh thành công!');
};

const startCamera = async () => {
  showCamera.value = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    streamRef.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (err) {
    console.error("Camera error:", err);
    push.error("Không thể mở máy ảnh. Vui lòng cấp quyền!");
    showCamera.value = false;
  }
};

const captureImage = () => {
  if (videoRef.value) {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.value.videoWidth || 640;
    canvas.height = videoRef.value.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      handleFile(file);
      stopCamera();
    }, 'image/jpeg');
  }
};

const stopCamera = () => {
  if (streamRef.value) {
    streamRef.value.getTracks().forEach(track => track.stop());
  }
  showCamera.value = false;
};

const startDiagnosis = () => {
  if (!imageFile.value) {
    push.error("Vui lòng chụp hoặc tải ảnh lên trước!");
    return;
  }
  // Store the image in session storage or state & redirect
  const reader = new FileReader();
  reader.readAsDataURL(imageFile.value);
  reader.onload = () => {
    sessionStorage.setItem('temp_diagnosis_img', reader.result);
    router.push({ name: 'diagnosis', query: { autostart: 'true' } });
  };
};

const resetSelection = () => {
  imageFile.value = null;
  previewUrl.value = null;
};
</script>

<template>
  <div class="bg-gradient-to-r from-emerald-900 via-green-950 to-emerald-950 rounded-3xl p-6 md:p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-500/20">
    <!-- Decorative background glow -->
    <div class="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -top-12 -left-12"></div>
    <div class="absolute w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -bottom-12 -right-12"></div>
    
    <div class="relative grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center z-10">
      <!-- Text & Medical info -->
      <div class="lg:col-span-6 text-left space-y-4 md:space-y-6">
        <span class="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md" style="color: #ffffff !important;">
          <span class="animate-ping w-2 h-2 rounded-full bg-lime-400"></span>
          ĐỘC QUYỀN TRÊN TESTSKIN AI
        </span>
        <h2 class="text-3xl md:text-5xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-teal-200" style="color: #ffffff !important;">
          Chẩn Đoán Bệnh Da <br/>Với Bác Sĩ Trí Tuệ Nhân Tạo
        </h2>
        <p class="text-emerald-100/90 text-sm md:text-base leading-relaxed" style="color: rgba(255, 255, 255, 0.9) !important;">
          Công nghệ học máy tiên tiến phân tích hơn 25 chứng bệnh da liễu khác nhau (mụn trứng cá, chàm, viêm da cơ địa,...) chỉ trong 5 giây. Kết quả chính xác tới 95% được kiểm chứng lâm sàng.
        </p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-emerald-200/90 pt-2">
          <div class="flex items-center gap-3" style="color: rgba(255, 255, 255, 0.95) !important;">
            <span class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm">✓</span>
            Bảo mật tuyệt đối thông tin
          </div>
          <div class="flex items-center gap-3" style="color: rgba(255, 255, 255, 0.95) !important;">
            <span class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm">✓</span>
            Độ chính xác lâm sàng cao
          </div>
          <div class="flex items-center gap-3" style="color: rgba(255, 255, 255, 0.95) !important;">
            <span class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm">✓</span>
            Khuyên dùng kèm theo giải pháp điều trị
          </div>
          <div class="flex items-center gap-3" style="color: rgba(255, 255, 255, 0.95) !important;">
            <span class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm">✓</span>
            Phân tích hoàn toàn miễn phí
          </div>
        </div>
      </div>
      
      <!-- Interactive Upload Image Area -->
      <div class="lg:col-span-6">
        <div 
          class="bg-white/5 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-inner flex flex-col items-center justify-center text-center relative"
          :class="[isDragging ? 'border-emerald-400 bg-white/10' : '']"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <!-- Camera Preview Panel -->
          <div v-if="showCamera" class="w-full relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-white/20">
            <video ref="videoRef" autoplay playsinline class="w-full h-full object-cover"></video>
            <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-20">
              <button @click="captureImage" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow text-xs">
                📷 Chụp Hình
              </button>
              <button @click="stopCamera" class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-full font-bold shadow text-xs">
                Hủy bỏ
              </button>
            </div>
          </div>
          
          <template v-else-if="previewUrl">
            <div class="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border-2 border-white/20 mb-4 group/preview">
              <img :src="previewUrl" class="w-full h-full object-cover" />
              <button 
                @click="resetSelection"
                class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
            
            <button 
              @click="startDiagnosis"
              class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl transition duration-300 uppercase tracking-wider text-sm"
            >
              ✨ Bắt đầu chuẩn đoán AI
            </button>
          </template>
          
          <template v-else>
            <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 text-3xl">
              📸
            </div>
            
            <h4 class="font-extrabold text-sm md:text-base text-slate-100" style="color: #ffffff !important;">
              Kéo thả hình ảnh vào đây
            </h4>
            <p class="text-xs text-emerald-250 mt-1 mb-6" style="color: rgba(255, 255, 255, 0.7) !important;">
              Hỗ trợ PNG, JPG, JPEG (Tối đa 10MB)
            </p>
            
            <div class="flex flex-wrap justify-center gap-3 w-full">
              <label class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3.5 rounded-xl cursor-pointer text-xs flex-grow sm:flex-grow-0 text-center transition">
                Tải Ảnh Lên
                <input type="file" class="hidden" accept="image/*" @change="onFileSelect" />
              </label>
              
              <button 
                @click="startCamera"
                class="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-4 py-3.5 rounded-xl text-xs flex-grow sm:flex-grow-0 transition"
              >
                Mở Máy Ảnh
              </button>
            </div>
          </template>
          
          <div class="mt-6 text-[10px] text-emerald-200/70 flex items-start gap-1 text-left" style="color: rgba(255, 255, 255, 0.6) !important;">
            <span>⚠️</span>
            <span>Lưu ý: Kết quả chẩn đoán da liễu bằng AI chỉ có giá trị tham khảo hỗ trợ, không thể thay thế ý kiến chuyên môn của bác sĩ da liễu.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
