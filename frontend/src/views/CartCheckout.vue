<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { push } from "notivue";
import OrderService from "../services/order.service";
import PaymentService from "../services/payment.service";

const router = useRouter();
const orderService = new OrderService();
const paymentService = new PaymentService();

const cartItems = ref([]);
const shipping_address = ref("");
const phone_number = ref("");
const payment_method = ref("COD");
const isSubmitting = ref(false);

// Address Modal State
const showAddressModal = ref(false);
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

const loadCartAndUser = () => {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cartItems.value = JSON.parse(savedCart);
  }

  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      shipping_address.value = user.address || "";
      phone_number.value = user.phone || "";
    } catch (e) {
      console.error(e);
    }
  }
};

const openAddressModal = () => {
  tempAddress.value = shipping_address.value;
  tempPhone.value = phone_number.value;
  showAddressModal.value = true;
};

const saveAddress = () => {
  if (!tempAddress.value.trim()) {
    push.warning("Địa chỉ không được để trống!");
    return;
  }
  if (!tempPhone.value.trim()) {
    push.warning("Số điện thoại không được để trống!");
    return;
  }
  shipping_address.value = tempAddress.value;
  phone_number.value = tempPhone.value;
  showAddressModal.value = false;
  push.success("Cập nhật địa chỉ nhận hàng thành công!");
};

const totalPrice = computed(() => {
  return cartItems.value.reduce((acc, item) => {
    const price = item.product.flash_sale_price || item.product.price;
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
  if (!shipping_address.value.trim()) {
    push.warning("Vui lòng thiết lập địa chỉ giao hàng!");
    openAddressModal();
    return;
  }
  if (!phone_number.value.trim()) {
    push.warning("Vui lòng thiết lập số điện thoại nhận hàng!");
    openAddressModal();
    return;
  }

  try {
    isSubmitting.value = true;
    
    const orderPromises = cartItems.value.map(async (item) => {
      const data = {
        user_id: user_id.value,
        product_id: item.product._id,
        shipping_address: shipping_address.value,
        phone_number: phone_number.value,
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
  loadCartAndUser();
});
</script>

<template>
  <div class="pe-page">
    <Header />

    <main class="pe-main">
      <div class="pe-container max-w-5xl">
        <!-- Header bar -->
        <div class="pe-header">
          <RouterLink to="/cart" class="pe-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
            </svg>
          </RouterLink>
          <h1 class="pe-title">Xác nhận thanh toán</h1>
        </div>

        <!-- Shopee Style Address Card (Full width on top) -->
        <div class="shopee-address-card mb-6">
          <div class="shopee-stripe"></div>
          <div class="p-6">
            <div class="flex items-center gap-2 text-teal-700 font-bold text-base mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
              Địa Chỉ Nhận Hàng
            </div>
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div class="text-sm text-gray-800 leading-relaxed">
                <template v-if="shipping_address && phone_number">
                  <span class="font-black text-gray-900 mr-4">{{ userName }} {{ phone_number }}</span>
                  <span class="text-gray-600">{{ shipping_address }}</span>
                </template>
                <template v-else>
                  <span class="text-red-500 font-bold">Chưa thiết lập địa chỉ nhận hàng. Vui lòng cập nhật ngay!</span>
                </template>
              </div>
              <button @click="openAddressModal" class="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wider whitespace-nowrap">
                Thay đổi
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <!-- Form Section -->
          <div class="lg:col-span-3 space-y-6">
            <!-- Payment Method -->
            <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 class="text-lg font-bold text-gray-800 mb-4">💳 Phương thức thanh toán</h2>
              <div class="space-y-3">
                <label class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                       :class="payment_method === 'COD' ? 'border-teal-500 bg-teal-50/20' : 'border-gray-200 hover:border-gray-300'">
                  <input type="radio" value="COD" v-model="payment_method" class="accent-teal-600 w-5 h-5" />
                  <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">💵</div>
                    <div>
                      <p class="font-bold text-gray-800 text-sm">Thanh toán khi nhận hàng (COD)</p>
                      <p class="text-xs text-gray-500">Trả tiền mặt cho shipper khi nhận hàng</p>
                    </div>
                  </div>
                </label>

                <label class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                       :class="payment_method === 'BANK_TRANSFER' ? 'border-teal-500 bg-teal-50/20' : 'border-gray-200 hover:border-gray-300'">
                  <input type="radio" value="BANK_TRANSFER" v-model="payment_method" class="accent-teal-600 w-5 h-5" />
                  <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🏦</div>
                    <div>
                      <p class="font-bold text-gray-800 text-sm">Chuyển khoản ngân hàng</p>
                      <p class="text-xs text-gray-500">Chuyển khoản trực tiếp qua tài khoản ngân hàng</p>
                    </div>
                  </div>
                </label>

                <label class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                       :class="payment_method === 'VNPAY' ? 'border-teal-500 bg-teal-50/20' : 'border-gray-200 hover:border-gray-300'">
                  <input type="radio" value="VNPAY" v-model="payment_method" class="accent-teal-600 w-5 h-5" />
                  <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-xl">📱</div>
                    <div>
                      <p class="font-bold text-gray-800 text-sm">Ví điện tử VNPAY</p>
                      <p class="text-xs text-gray-500">Thanh toán qua cổng VNPAY</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Order Summary Section -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 class="text-lg font-bold text-gray-800 mb-4">🛒 Chi tiết đơn hàng</h2>
              
              <div class="divide-y divide-gray-100 max-h-60 overflow-y-auto mb-6">
                <div v-for="item in cartItems" :key="item.product._id" class="py-3 flex gap-3 items-center">
                  <img :src="item.product.image || 'https://picsum.photos/100'" class="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                  <div class="flex-grow min-w-0">
                    <h4 class="font-semibold text-gray-800 text-sm truncate">{{ item.product.title }}</h4>
                    <p class="text-xs text-gray-500">SL: {{ item.quantity }} × {{ formatPrice(item.product.flash_sale_price || item.product.price) }}</p>
                  </div>
                  <span class="font-bold text-sm text-gray-700">{{ formatPrice((item.product.flash_sale_price || item.product.price) * item.quantity) }}</span>
                </div>
              </div>

              <div class="border-t border-gray-100 pt-4 space-y-3">
                <div class="flex justify-between text-gray-500 text-sm">
                  <span>Tạm tính</span>
                  <span>{{ formatPrice(totalPrice) }}</span>
                </div>
                <div class="flex justify-between text-gray-500 text-sm">
                  <span>Vận chuyển</span>
                  <span class="text-teal-600 font-bold">Miễn phí</span>
                </div>
                <div class="border-t border-dashed border-gray-200 pt-3 flex justify-between font-black text-lg text-gray-900">
                  <span>Tổng thanh toán</span>
                  <span class="text-teal-600">{{ formatPrice(totalPrice) }}</span>
                </div>
              </div>

              <button @click="handleCheckout" :disabled="isSubmitting" class="pe-btn pe-btn--primary w-full mt-6 flex justify-center items-center">
                <span v-if="isSubmitting" class="loading loading-spinner mr-2"></span>
                Đặt hàng ngay
              </button>
            </div>
          </div>
        </div>

        <!-- Address Edit Modal -->
        <div v-if="showAddressModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div class="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-gray-100 animate-in fade-in duration-200">
            <h3 class="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
              📍 Cập nhật địa chỉ nhận hàng
            </h3>
            <div class="space-y-5">
              <div class="pe-field">
                <label class="pe-label">Số điện thoại liên hệ</label>
                <input v-model="tempPhone" type="text" class="pe-input" placeholder="Nhập số điện thoại nhận hàng..." />
              </div>
              <div class="pe-field">
                <label class="pe-label">Địa chỉ chi tiết</label>
                <textarea v-model="tempAddress" class="pe-input h-24 resize-none" placeholder="Nhập địa chỉ nhà, tên đường, phường/xã, quận/huyện..."></textarea>
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
  background: #f0fdf4; /* Mint white background */
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

/* ─── Header bar ─── */
.pe-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.pe-back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  transition: all 0.15s;
  flex-shrink: 0;
}

.pe-back-btn:hover {
  background: #f8fafc;
  border-color: #0d9488;
  color: #0d9488;
}

.pe-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 0;
}

/* ─── Shopee style Address Card ─── */
.shopee-address-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(13,148,136,0.03);
  position: relative;
}

.shopee-stripe {
  height: 4px;
  width: 100%;
  background-image: repeating-linear-gradient(-45deg, #0d9488, #0d9488 15px, #ffffff 15px, #ffffff 30px, #3b82f6 30px, #3b82f6 45px, #ffffff 45px, #ffffff 60px);
}

.pe-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pe-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.04em;
}

.pe-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.pe-input:focus {
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13,148,136,0.2);
}

.pe-btn {
  padding: 0.9rem;
  border-radius: 50px;
  border: none;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  letter-spacing: 0.02em;
}

.pe-btn--primary {
  background: linear-gradient(135deg, #0d9488, #0f766e);
  color: white;
  box-shadow: 0 4px 16px rgba(13,148,136,0.35);
}

.pe-btn--primary:hover {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(13,148,136,0.5);
}
</style>
