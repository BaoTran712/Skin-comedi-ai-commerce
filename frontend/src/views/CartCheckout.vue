<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { push } from "notivue";
import OrderService from "../services/order.service";
import PaymentService from "../services/payment.service";
import AddressService from "../services/address.service";
import DiagnosisService from "../services/diagnosis.service";

const router = useRouter();
const orderService = new OrderService();
const paymentService = new PaymentService();
const addressService = new AddressService();
const diagnosisService = new DiagnosisService();

const cartItems = ref([]);
const addresses = ref([]);
const selectedAddressId = ref(null);
const payment_method = ref("COD");
const isSubmitting = ref(false);
const latestDiagnosis = ref(null);

const hasRecommendedProducts = computed(() => {
  if (!latestDiagnosis.value) return false;
  return cartItems.value.some(item => {
    return latestDiagnosis.value.recommended_products?.some(p => {
      const id = p._id || p;
      return id === item.product._id;
    });
  });
});

// Address Modal State
const showAddressModal = ref(false);
const isEditing = ref(false);
const editingAddressId = ref(null);
const tempLabel = ref("Nhà riêng");
const tempAddress = ref("");
const tempPhone = ref("");

const user_id = computed(() => localStorage.getItem("id"));
const role = computed(() => localStorage.getItem("role"));

const userName = computed(() => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      return `${user.last_name || ''} ${user.first_name || ''}`.trim() || 'Khách hàng';
    } catch (e) {}
  }
  return 'Khách hàng';
});

const loadCartAndAddresses = async () => {
  // Load Cart
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cartItems.value = JSON.parse(savedCart);
  }

  // Load User Addresses
  try {
    const list = await addressService.getAddresses();
    addresses.value = list;
    if (list.length > 0) {
      const defaultAddr = list.find(a => a.isDefault) || list[0];
      selectedAddressId.value = defaultAddr._id;
    }
  } catch (err) {
    console.error("Lỗi lấy địa chỉ:", err);
    push.error("Không thể lấy danh sách địa chỉ nhận hàng.");
  }

  // Load Latest Diagnosis
  if (user_id.value) {
    try {
      const diag = await diagnosisService.getLatestDiagnosis(user_id.value);
      if (diag) {
        latestDiagnosis.value = diag;
      }
    } catch (err) {
      console.error("Lỗi lấy chẩn đoán:", err);
    }
  }
};

const activeAddress = computed(() => {
  return addresses.value.find(a => a._id === selectedAddressId.value) || null;
});

const openNewAddressModal = () => {
  isEditing.value = false;
  editingAddressId.value = null;
  tempLabel.value = "Nhà riêng";
  tempAddress.value = "";
  tempPhone.value = "";
  showAddressModal.value = true;
};

const openEditAddressModal = (addr) => {
  isEditing.value = true;
  editingAddressId.value = addr._id;
  tempLabel.value = addr.label || "Nhà riêng";
  tempAddress.value = addr.address || "";
  tempPhone.value = addr.phone || "";
  showAddressModal.value = true;
};

const saveAddress = async () => {
  if (!tempAddress.value.trim()) {
    push.warning("Địa chỉ không được để trống!");
    return;
  }
  if (!tempPhone.value.trim()) {
    push.warning("Số điện thoại không được để trống!");
    return;
  }

  try {
    const payload = {
      label: tempLabel.value,
      address: tempAddress.value,
      phone: tempPhone.value,
      isDefault: addresses.value.length === 0 // Make default if it's the first one
    };

    let updatedList;
    if (isEditing.value) {
      updatedList = await addressService.updateAddress(editingAddressId.value, payload);
      push.success("Cập nhật địa chỉ thành công!");
    } else {
      updatedList = await addressService.addAddress(payload);
      push.success("Thêm địa chỉ nhận hàng thành công!");
    }

    addresses.value = updatedList;
    if (updatedList.length > 0) {
      selectedAddressId.value = updatedList[updatedList.length - 1]._id;
    }
    showAddressModal.value = false;
  } catch (err) {
    console.error("Lỗi lưu địa chỉ:", err);
    push.error("Không thể lưu địa chỉ nhận hàng.");
  }
};

const deleteAddress = async (id) => {
  if (confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
    try {
      const res = await addressService.deleteAddress(id);
      addresses.value = res.addresses;
      if (selectedAddressId.value === id) {
        selectedAddressId.value = res.addresses.length > 0 ? res.addresses[0]._id : null;
      }
      push.success("Đã xóa địa chỉ thành công!");
    } catch (err) {
      console.error(err);
      push.error("Không thể xóa địa chỉ.");
    }
  }
};

const totalPrice = computed(() => {
  return cartItems.value.reduce((acc, item) => {
    const price = item.variant ? item.variant.price : (item.product.flash_sale_price || item.product.price);
    return acc + (price * item.quantity);
  }, 0);
});

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const handleCheckout = async () => {
  if (cartItems.value.length === 0) {
    push.error("Giỏ hàng của bạn đang trống!");
    return;
  }
  if (!selectedAddressId.value) {
    push.warning("Vui lòng chọn địa chỉ giao hàng!");
    return;
  }

  try {
    isSubmitting.value = true;
    
    const orderPromises = cartItems.value.map(async (item) => {
      const data = {
        user_id: user_id.value,
        product_id: item.product._id,
        variant_id: item.variant_id || undefined,
        quantity: item.quantity,
        addressId: selectedAddressId.value,
        payment_method: payment_method.value,
      };
      return await orderService.createOrder(data);
    });

    const results = await Promise.all(orderPromises);
    
    if (payment_method.value === 'VNPAY' && results.length > 0) {
      const firstOrder = results[0];
      const amount = totalPrice.value;
      const order_id = firstOrder._id;
      try {
        const paymentResponse = await paymentService.createVnpayUrl({ amount, order_id });
        if (paymentResponse?.payment_url) {
          localStorage.removeItem("cart");
          window.location.href = paymentResponse.payment_url;
          return;
        }
      } catch (err) {
        console.error("VNPAY URL Error:", err);
      }
    }

    push.success("Đặt hàng thành công!");
    localStorage.removeItem("cart");
    router.push({ name: "order.check" });
  } catch (error) {
    console.error(error);
    push.error("Đã có lỗi xảy ra trong quá trình đặt hàng");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  if (role.value !== "user") {
    push.error("Vui lòng đăng nhập tài khoản người dùng!");
    router.push("/user/login");
    return;
  }
  loadCartAndAddresses();
});
</script>

<template>
  <div class="pe-page">
    <Header />
    <CategoryMenu />

    <main class="pe-main">
      <div class="pe-container max-w-5xl">
        <!-- Header bar -->
        <div class="pe-header">
          <RouterLink to="/cart" class="pe-back-btn">
            ←
          </RouterLink>
          <h1 class="pe-title">Xác nhận đặt hàng</h1>
        </div>

        <!-- Shopee Style Address Card -->
        <div class="shopee-address-card mb-6">
          <div class="shopee-stripe"></div>
          <div class="p-6">
            <div class="flex items-center justify-between gap-2 text-emerald-600 font-extrabold text-base mb-4">
              <span class="flex items-center gap-1.5">📍 Địa Chỉ Nhận Hàng</span>
              <button 
                @click="openNewAddressModal" 
                class="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                + Thêm địa chỉ mới
              </button>
            </div>
            
            <div v-if="addresses.length > 0" class="space-y-4">
              <!-- Select Address list -->
              <div 
                v-for="addr in addresses" 
                :key="addr._id"
                class="flex items-start gap-4 p-4 rounded-xl border transition"
                :class="selectedAddressId === addr._id ? 'border-emerald-600 bg-emerald-50/10' : 'border-slate-100 hover:border-slate-200'"
              >
                <input 
                  type="radio" 
                  :id="addr._id"
                  :value="addr._id" 
                  v-model="selectedAddressId"
                  class="accent-emerald-600 mt-1"
                />
                
                <div class="flex-grow text-left text-sm leading-relaxed">
                  <div class="flex items-center gap-2">
                    <span class="font-black text-slate-800">{{ userName }}</span>
                    <span class="text-slate-400 font-bold">|</span>
                    <span class="font-bold text-slate-700">{{ addr.phone }}</span>
                    <span v-if="addr.isDefault" class="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black px-1.5 py-0.5 rounded">
                      Mặc định
                    </span>
                    <span class="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {{ addr.label }}
                    </span>
                  </div>
                  <p class="text-slate-500 mt-1.5">{{ addr.address }}</p>
                </div>
                
                <div class="flex gap-2">
                  <button @click="openEditAddressModal(addr)" class="text-xs text-emerald-600 hover:underline">Sửa</button>
                  <button @click="deleteAddress(addr._id)" class="text-xs text-red-500 hover:underline">Xóa</button>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center py-6 text-slate-400 text-xs font-semibold">
              Chưa có địa chỉ giao hàng nào. Vui lòng bấm vào nút thêm địa chỉ mới ở trên!
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start text-left">
          <!-- Form Section -->
          <div class="lg:col-span-3 space-y-6">
            <!-- AI Diagnosis Summary Panel -->
            <div v-if="hasRecommendedProducts && latestDiagnosis" class="bg-gradient-to-r from-emerald-50 via-teal-50/20 to-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <div class="flex items-center gap-2 text-emerald-600 font-extrabold text-sm uppercase tracking-wider">
                <span>🔬 Tóm tắt chẩn đoán AI</span>
              </div>
              <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <img :src="latestDiagnosis.image_url" class="w-16 h-16 rounded-2xl object-cover border border-emerald-100 flex-shrink-0 shadow-sm" />
                <div class="space-y-1">
                  <p class="text-xs text-slate-400">Kết quả phân tích da gần nhất</p>
                  <p class="text-sm text-slate-800 font-extrabold">
                    Tình trạng: <span class="text-emerald-600">{{ latestDiagnosis.result }}</span>
                  </p>
                  <p class="text-xs text-emerald-700 font-semibold">
                    Độ tin cậy của AI: {{ Math.round(latestDiagnosis.confidence * 100) }}%
                  </p>
                </div>
              </div>
              <div class="text-[11px] text-slate-500 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/40 leading-relaxed">
                <p class="font-bold text-emerald-800 mb-1">⚠️ Khuyến cáo Y tế quan trọng:</p>
                Hệ thống AI hỗ trợ chuẩn đoán hình ảnh lâm sàng ban đầu nhằm đưa ra gợi ý sản phẩm phù hợp. Việc này hoàn toàn không thay thế cho quyết định điều trị, đơn thuốc hay tư vấn chuyên môn trực tiếp của bác sĩ da liễu có thẩm quyền.
              </div>
            </div>

            <!-- Payment Method -->
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 class="text-base font-extrabold text-slate-800 mb-4">💳 Phương thức thanh toán</h2>
              <div class="space-y-3">
                <label 
                  class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                  :class="payment_method === 'COD' ? 'border-emerald-600 bg-emerald-50/15' : 'border-slate-100 hover:border-slate-200'"
                >
                  <input type="radio" value="COD" v-model="payment_method" class="accent-emerald-600 w-4 h-4" />
                  <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">💵</div>
                    <div>
                      <p class="font-extrabold text-slate-800 text-sm">Thanh toán khi nhận hàng (COD)</p>
                      <p class="text-xs text-slate-400">Trả tiền mặt cho shipper khi nhận hàng</p>
                    </div>
                  </div>
                </label>

                <label 
                  class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                  :class="payment_method === 'VNPAY' ? 'border-emerald-600 bg-emerald-50/15' : 'border-slate-100 hover:border-slate-200'"
                >
                  <input type="radio" value="VNPAY" v-model="payment_method" class="accent-emerald-600 w-4 h-4" />
                  <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">💳</div>
                    <div>
                      <p class="font-extrabold text-slate-800 text-sm">Thanh toán online qua VNPAY</p>
                      <p class="text-xs text-slate-400">ATM, thẻ tín dụng hoặc quét mã QR</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Order Summary Section -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 class="text-base font-extrabold text-slate-800 mb-4">🛒 Chi tiết đơn hàng</h2>
              
              <div class="divide-y divide-slate-50 max-h-60 overflow-y-auto mb-6">
                <div v-for="item in cartItems" :key="item.product._id + '-' + (item.variant_id || '')" class="py-3 flex gap-3 items-center">
                  <img 
                    :src="item.variant?.image || item.product.image || `https://placehold.co/100/f0fdf4/16a34a?text=IMG`" 
                    class="w-12 h-12 object-contain rounded-lg border border-slate-100 bg-slate-50 flex-shrink-0" 
                    @error="(e) => e.target.src = `https://placehold.co/100/f0fdf4/16a34a?text=IMG`"
                  />
                  <div class="flex-grow min-w-0 text-left">
                    <h4 class="font-bold text-slate-800 text-xs truncate">{{ item.product.title }}</h4>
                    <p v-if="item.variant" class="text-[10px] text-orange-600 font-semibold bg-orange-50 rounded px-1.5 py-0.5 inline-block my-1">
                      📦 <span v-for="attr in item.variant.attributes" :key="attr.name">{{ attr.name }}: {{ attr.value }}</span>
                    </p>
                    <p class="text-[10px] text-slate-400">SL: {{ item.quantity }} × {{ formatPrice(item.variant ? item.variant.price : (item.product.flash_sale_price || item.product.price)) }}</p>
                  </div>
                  <span class="font-bold text-xs text-slate-700">{{ formatPrice((item.variant ? item.variant.price : (item.product.flash_sale_price || item.product.price)) * item.quantity) }}</span>
                </div>
              </div>

              <div class="border-t border-slate-50 pt-4 space-y-3">
                <div class="flex justify-between text-slate-500 text-xs">
                  <span>Tạm tính</span>
                  <span>{{ formatPrice(totalPrice) }}</span>
                </div>
                <div class="flex justify-between text-slate-500 text-xs">
                  <span>Vận chuyển</span>
                  <span class="text-emerald-500 font-bold">Miễn phí</span>
                </div>
                <div class="border-t border-dashed border-slate-200 pt-3 flex justify-between font-black text-sm text-slate-800">
                  <span>Tổng thanh toán</span>
                  <span class="text-emerald-600 text-base">{{ formatPrice(totalPrice) }}</span>
                </div>
              </div>

              <button 
                @click="handleCheckout" 
                :disabled="isSubmitting || addresses.length === 0" 
                class="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold py-3.5 rounded-xl shadow-lg mt-6 flex justify-center items-center text-sm disabled:opacity-50"
              >
                <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Đặt Hàng Ngay
              </button>
            </div>
          </div>
        </div>

        <!-- Address Add/Edit Modal -->
        <div v-if="showAddressModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div class="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-slate-100 animate-in fade-in duration-200 text-left">
            <h3 class="text-lg font-black text-slate-800 mb-6">
              📍 {{ isEditing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ giao hàng mới' }}
            </h3>
            
            <div class="space-y-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên nhãn địa chỉ</label>
                <input v-model="tempLabel" type="text" class="pe-input" placeholder="Ví dụ: Nhà riêng, Văn phòng..." />
              </div>
              
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại liên hệ</label>
                <input v-model="tempPhone" type="text" class="pe-input" placeholder="Nhập số điện thoại nhận hàng..." />
              </div>
              
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ nhận hàng chi tiết</label>
                <textarea v-model="tempAddress" class="pe-input h-24 resize-none" placeholder="Nhập địa chỉ nhà, số nhà, tên đường, phường/xã..."></textarea>
              </div>
            </div>
            
            <div class="flex justify-end gap-3 mt-8">
              <button @click="showAddressModal = false" class="btn btn-sm btn-ghost rounded-full px-6">
                Hủy
              </button>
              <button @click="saveAddress" class="btn btn-sm btn-primary rounded-full px-8 text-white">
                Xác nhận
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.pe-page {
  min-height: 100vh;
  background: #F8FAFC;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.pe-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2.5rem 1rem 4rem;
}

.pe-container {
  width: 100%;
}

.pe-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.pe-back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  font-weight: bold;
  transition: all 0.15s;
  flex-shrink: 0;
  text-decoration: none;
}

.pe-back-btn:hover {
  background: #f8fafc;
  border-color: #4F46E5;
  color: #4F46E5;
}

.pe-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #1e293b;
  letter-spacing: -0.03em;
  margin: 0;
}

.shopee-address-card {
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.02);
  position: relative;
}

.shopee-stripe {
  height: 4px;
  width: 100%;
  background-image: repeating-linear-gradient(-45deg, #4F46E5, #4F46E5 15px, #ffffff 15px, #ffffff 30px, #6D28D9 30px, #6D28D9 45px, #ffffff 45px, #ffffff 60px);
}

.pe-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.pe-input:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}
</style>
