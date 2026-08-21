<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProductService from '../services/product.service';
import OrderService from '../services/order.service';
import PaymentService from '../services/payment.service';
import AddressService from '../services/address.service';
import LocationService from '../services/location.service';
import PromotionService from '../services/promotion.service';
import UserService from '../services/user.service';
import { push } from 'notivue';

const productService = new ProductService();
const orderService = new OrderService();
const paymentService = new PaymentService();
const addressService = new AddressService();
const promotionService = new PromotionService();
const userService = new UserService();

// Voucher & Xu State
const promotions = ref([]);
const userPoints = ref(0);
const selectedPromotion = ref(null);
const usePointsInput = ref(0);
const usePointsChecked = ref(false);
const showVoucherModal = ref(false);
const voucherCodeInput = ref("");

const route = useRoute();
const router = useRouter();

const user_id = computed(() => localStorage.getItem("id"));
const role = computed(() => localStorage.getItem("role"));
const product_id = route.params.id;
const product = ref({});
const payment_method = ref("COD");

const addresses = ref([]);
const selectedAddressId = ref(null);

// Address Modal State
const showAddressModal = ref(false);
const isEditing = ref(false);
const editingAddressId = ref(null);
const tempLabel = ref("Nhà riêng");
const tempRecipientName = ref("");
const tempPhone = ref("");

// Location Select State
const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);

const tempProvinceCode = ref("");
const tempProvinceName = ref("");
const tempDistrictCode = ref("");
const tempDistrictName = ref("");
const tempWardCode = ref("");
const tempWardName = ref("");
const tempAddressDetail = ref("");

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

const formatAddress = (addr) => {
  if (!addr) return "---";
  if (addr.addressDetail) {
    return `${addr.addressDetail}, ${addr.wardName}, ${addr.districtName}, ${addr.provinceName}`;
  }
  return addr.address || "---"; // Fallback for old format
};

const loadProvinces = async () => {
  try {
    provinces.value = await LocationService.getProvinces();
  } catch (error) {
    console.error("Failed to load provinces", error);
  }
};

const onProvinceChange = async () => {
  tempDistrictCode.value = "";
  tempDistrictName.value = "";
  tempWardCode.value = "";
  tempWardName.value = "";
  districts.value = [];
  wards.value = [];
  const p = provinces.value.find(x => x.code == tempProvinceCode.value);
  if (p) {
    tempProvinceName.value = p.name;
    districts.value = await LocationService.getDistricts(p.code);
  } else {
    tempProvinceName.value = "";
  }
};

const onDistrictChange = async () => {
  tempWardCode.value = "";
  tempWardName.value = "";
  wards.value = [];
  const d = districts.value.find(x => x.code == tempDistrictCode.value);
  if (d) {
    tempDistrictName.value = d.name;
    wards.value = await LocationService.getWards(d.code);
  } else {
    tempDistrictName.value = "";
  }
};

const onWardChange = () => {
  const w = wards.value.find(x => x.code == tempWardCode.value);
  if (w) {
    tempWardName.value = w.name;
  } else {
    tempWardName.value = "";
  }
};

const loadAddresses = async () => {
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
};

const openNewAddressModal = async () => {
  isEditing.value = false;
  editingAddressId.value = null;
  tempLabel.value = "Nhà riêng";
  tempRecipientName.value = userName.value || "";
  tempPhone.value = "";
  tempProvinceCode.value = "";
  tempProvinceName.value = "";
  tempDistrictCode.value = "";
  tempDistrictName.value = "";
  tempWardCode.value = "";
  tempWardName.value = "";
  tempAddressDetail.value = "";
  districts.value = [];
  wards.value = [];
  showAddressModal.value = true;
};

const openEditAddressModal = async (addr) => {
  isEditing.value = true;
  editingAddressId.value = addr._id;
  tempLabel.value = addr.label || "Nhà riêng";
  tempRecipientName.value = addr.recipientName || userName.value || "";
  tempPhone.value = addr.phone || "";
  tempProvinceCode.value = addr.provinceCode || "";
  tempProvinceName.value = addr.provinceName || "";
  tempDistrictCode.value = addr.districtCode || "";
  tempDistrictName.value = addr.districtName || "";
  tempWardCode.value = addr.wardCode || "";
  tempWardName.value = addr.wardName || "";
  tempAddressDetail.value = addr.addressDetail || addr.address || "";
  
  if (tempProvinceCode.value) {
    districts.value = await LocationService.getDistricts(tempProvinceCode.value);
  }
  if (tempDistrictCode.value) {
    wards.value = await LocationService.getWards(tempDistrictCode.value);
  }
  showAddressModal.value = true;
};

const saveAddress = async () => {
  if (!tempProvinceCode.value || !tempDistrictCode.value || !tempWardCode.value || !tempAddressDetail.value.trim()) {
    push.warning("Vui lòng chọn đầy đủ Tỉnh, Huyện, Xã và nhập số nhà!");
    return;
  }
  if (!tempPhone.value.trim()) {
    push.warning("Số điện thoại không được để trống!");
    return;
  }

  // Ensure names are populated
  const p = provinces.value.find(x => x.code == tempProvinceCode.value);
  if (p) tempProvinceName.value = p.name;
  const d = districts.value.find(x => x.code == tempDistrictCode.value);
  if (d) tempDistrictName.value = d.name;
  const w = wards.value.find(x => x.code == tempWardCode.value);
  if (w) tempWardName.value = w.name;

  try {
    const payload = {
      label: tempLabel.value,
      recipientName: tempRecipientName.value.trim() || userName.value,
      provinceCode: tempProvinceCode.value,
      provinceName: tempProvinceName.value,
      districtCode: tempDistrictCode.value,
      districtName: tempDistrictName.value,
      wardCode: tempWardCode.value,
      wardName: tempWardName.value,
      addressDetail: tempAddressDetail.value.trim(),
      phone: tempPhone.value.trim(),
      isDefault: addresses.value.length === 0
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
  return product.value ? (product.value.flash_sale_price || product.value.price || 0) : 0;
});

// --- Voucher & Points Computeds & Methods ---
const eligiblePromotions = computed(() => {
  const now = new Date();
  return promotions.value.filter(promo => {
    if (promo.trang_thai !== "active") return false;
    const start = new Date(promo.ngay_bat_dau);
    const end = new Date(promo.ngay_ket_thuc);
    if (now < start || now > end) return false;
    if (totalPrice.value < promo.gia_tri_don_toi_thieu) return false;
    if (promo.gioi_han_su_dung !== null && promo.so_lan_da_dung >= promo.gioi_han_su_dung) return false;
    return true;
  });
});

const discountVoucher = computed(() => {
  if (!selectedPromotion.value) return 0;
  const promo = selectedPromotion.value;
  let disc = 0;
  if (promo.loai_giam_gia === "percentage") {
    disc = Math.round(totalPrice.value * (promo.gia_tri_giam / 100));
    if (promo.so_tien_giam_toi_da) {
      disc = Math.min(disc, promo.so_tien_giam_toi_da);
    }
  } else {
    disc = promo.gia_tri_giam;
  }
  return Math.min(disc, totalPrice.value);
});

const maxPointsAllowed = computed(() => {
  const maxVal = Math.max(0, totalPrice.value - discountVoucher.value);
  return Math.min(userPoints.value, Math.floor(maxVal / 1000));
});

const discountPoints = computed(() => {
  if (!usePointsChecked.value) return 0;
  const pts = Math.min(usePointsInput.value, maxPointsAllowed.value);
  return pts * 1000;
});

const totalPayment = computed(() => {
  // Shipping fee is free in OrderAdd (0) based on UI, but let's make it robust
  const shippingFee = 0;
  const amt = totalPrice.value + shippingFee - discountVoucher.value - discountPoints.value;
  return Math.max(0, amt);
});

const toggleUsePoints = (event) => {
  if (event.target.checked) {
    usePointsInput.value = maxPointsAllowed.value;
  } else {
    usePointsInput.value = 0;
  }
};

const validatePointsInput = () => {
  if (usePointsInput.value < 0) {
    usePointsInput.value = 0;
  } else if (usePointsInput.value > maxPointsAllowed.value) {
    usePointsInput.value = maxPointsAllowed.value;
    push.warning(`Bạn chỉ được sử dụng tối đa ${maxPointsAllowed.value} xu cho đơn hàng này.`);
  }
};

const useMaxPoints = () => {
  usePointsInput.value = maxPointsAllowed.value;
  usePointsChecked.value = true;
};

const selectVoucher = (promo) => {
  selectedPromotion.value = promo;
  showVoucherModal.value = false;
  if (usePointsChecked.value && usePointsInput.value > maxPointsAllowed.value) {
    usePointsInput.value = maxPointsAllowed.value;
  }
};

const applyVoucherByCode = () => {
  const code = voucherCodeInput.value.trim().toUpperCase();
  if (!code) {
    push.warning("Vui lòng nhập mã voucher.");
    return;
  }
  const matched = promotions.value.find(p => p.ma_khuyen_mai.toUpperCase() === code);
  if (!matched) {
    push.error("Mã voucher không tồn tại trong hệ thống.");
    return;
  }
  const now = new Date();
  const start = new Date(matched.ngay_bat_dau);
  const end = new Date(matched.ngay_ket_thuc);
  if (matched.trang_thai !== "active" || now < start || now > end) {
    push.error("Voucher này đã hết hạn hoặc không hoạt động.");
    return;
  }
  if (totalPrice.value < matched.gia_tri_don_toi_thieu) {
    push.error(`Voucher này chỉ áp dụng cho đơn hàng tối thiểu ${formatPrice(matched.gia_tri_don_toi_thieu)}.`);
    return;
  }
  if (matched.gioi_han_su_dung !== null && matched.so_lan_da_dung >= matched.gioi_han_su_dung) {
    push.error("Voucher này đã hết lượt sử dụng.");
    return;
  }

  selectedPromotion.value = matched;
  voucherCodeInput.value = "";
  push.success(`Đã áp dụng voucher ${matched.ma_khuyen_mai}!`);
  
  if (usePointsChecked.value && usePointsInput.value > maxPointsAllowed.value) {
    usePointsInput.value = maxPointsAllowed.value;
  }
};

const togglePointsUsage = () => {
  if (usePointsChecked.value) {
    usePointsChecked.value = false;
    usePointsInput.value = 0;
  } else {
    if (usePointsInput.value <= 0) {
      usePointsInput.value = maxPointsAllowed.value;
    }
    if (usePointsInput.value > 0) {
      usePointsChecked.value = true;
      validatePointsInput();
    } else {
      push.warning("Số xu sử dụng phải lớn hơn 0.");
    }
  }
};

const loadPointsAndPromotions = async () => {
  if (!user_id.value) return;
  try {
    const pointsData = await userService.getUserPoints();
    userPoints.value = pointsData.points || 0;
  } catch (e) {
    console.error("Lỗi lấy điểm tích lũy:", e);
  }
  try {
    const promos = await promotionService.getAllPromotions();
    promotions.value = promos || [];
  } catch (e) {
    console.error("Lỗi lấy khuyến mãi:", e);
  }
};

const handleCreateOrder = async () => {
  if (!selectedAddressId.value) {
    if (addresses.value.length > 0) {
      selectedAddressId.value = addresses.value[0]._id;
    } else {
      push.warning("Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng!");
      openNewAddressModal();
      return;
    }
  }

  try {
    const data = {
      user_id: user_id.value,
      product_id: product_id,
      addressId: selectedAddressId.value,
      payment_method: payment_method.value,
      promotion_id: selectedPromotion.value ? selectedPromotion.value.id : undefined,
      points_used: usePointsChecked.value ? usePointsInput.value : 0,
    };

    const orderResponse = await orderService.createOrder(data);
    const orderDoc = orderResponse.document || orderResponse;
    const amount = totalPayment.value;
    const order_id = orderDoc._id;
    const order_code = orderDoc.order_code || '';

    if (payment_method.value === 'VNPAY') {
      const paymentResponse = await paymentService.createVnpayUrl({ amount, order_id, bank_code: 'VNPAYQR' });
      if (paymentResponse?.payment_url) {
        window.location.href = paymentResponse.payment_url;
        return;
      }
    }

    if (payment_method.value === 'MOMO') {
      try {
        const paymentResponse = await paymentService.createMomoUrl({ amount, order_id });
        if (paymentResponse?.payUrl || paymentResponse?.payment_url) {
          window.location.href = paymentResponse.payUrl || paymentResponse.payment_url;
          return;
        }
      } catch (err) {
        console.error("MoMo Payment Error:", err);
        const errMsg = err.response?.data?.message || "Tạo liên kết thanh toán MoMo thất bại";
        push.error(errMsg);
        return;
      }
    }

    if (payment_method.value === 'VIETQR' || payment_method.value === 'BANK_TRANSFER') {
      // Navigate to dedicated QR payment page
      router.push({
        name: 'payment.qr',
        query: {
          order_id,
          order_code,
          amount: String(Math.round(amount)),
        }
      });
      return;
    }

    push.success("Đặt hàng thành công!");
    router.push({ name: "order.check" });
  } catch (error) {
    console.log(error);
    const errMsg = error.response?.data?.message || "Đã có lỗi xảy ra trong quá trình đặt hàng";
    push.error(errMsg);
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

onMounted(async () => {
  const r = (role.value || "").toUpperCase();
  if (r !== "CUSTOMER" && r !== "USER" && r !== "ADMIN" && r !== "STAFF") {
    push.error("Vui lòng đăng nhập tài khoản người dùng!");
    router.push("/user/login");
    return;
  }
  
  loadAddresses();
  loadProvinces();
  loadPointsAndPromotions();

  try {
    const product_data = await productService.getProduct(product_id);
    product.value = product_data;
  } catch (error) {
    console.log(error);
  }
});
</script>

<template>
  <div class="pe-page">
    <Header />

    <main class="pe-main">
      <div class="pe-container max-w-5xl">
        <!-- Header bar -->
        <div class="pe-header">
          <RouterLink to="/products" class="pe-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
            </svg>
          </RouterLink>
          <h1 class="pe-title">Xác nhận đặt hàng</h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
          <!-- BÊN TRÁI: Cột trái – Thông tin đặt hàng (2fr) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- 1. Địa chỉ nhận hàng -->
            <div class="shopee-address-card">
              <div class="shopee-stripe"></div>
              <div class="p-6">
                <div class="flex items-center justify-between gap-2 text-emerald-600 font-extrabold text-sm uppercase tracking-wider mb-4">
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
                        <span class="font-black text-slate-800">{{ addr.recipientName || userName }}</span>
                        <span class="text-slate-400 font-bold">|</span>
                        <span class="font-bold text-slate-700">{{ addr.phone }}</span>
                        <span v-if="addr.isDefault" class="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black px-1.5 py-0.5 rounded">
                          Mặc định
                        </span>
                        <span class="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {{ addr.label }}
                        </span>
                      </div>
                      <p class="text-slate-500 mt-1.5">{{ formatAddress(addr) }}</p>
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

            <!-- 2. Phương thức vận chuyển (Buy now has free delivery default) -->
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 class="text-base font-extrabold text-slate-800 mb-4">🚚 Phương thức vận chuyển</h2>
              <label class="flex items-center gap-4 p-4 rounded-2xl border border-emerald-600 bg-emerald-50/15 cursor-pointer">
                <input type="radio" checked class="accent-emerald-600 w-4 h-4" />
                <div class="flex items-center gap-3 flex-1">
                  <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">🛵</div>
                  <div class="flex-grow">
                    <p class="font-extrabold text-slate-800 text-sm">Giao hàng tiêu chuẩn (Miễn phí)</p>
                    <p class="text-xs text-slate-400">Thời gian nhận hàng dự kiến: 2-3 ngày</p>
                  </div>
                </div>
              </label>
            </div>

            <!-- 3. Phương thức thanh toán -->
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
                  :class="payment_method === 'VIETQR' ? 'border-emerald-600 bg-emerald-50/15' : 'border-slate-100 hover:border-slate-200'"
                >
                  <input type="radio" value="VIETQR" v-model="payment_method" class="accent-emerald-600 w-4 h-4" />
                  <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">📲</div>
                    <div>
                      <p class="font-extrabold text-slate-800 text-sm">Chuyển khoản QR Ngân hàng (VietQR)</p>
                      <p class="text-xs text-slate-400">Quét mã QR Ngân hàng trực tiếp trên website</p>
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
                      <p class="text-xs text-slate-400">ATM, Thẻ Visa/Mastercard hoặc VNPAY-QR</p>
                    </div>
                  </div>
                </label>

                <label 
                  class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                  :class="payment_method === 'MOMO' ? 'border-emerald-600 bg-emerald-50/15' : 'border-slate-100 hover:border-slate-200'"
                >
                  <input type="radio" value="MOMO" v-model="payment_method" class="accent-emerald-600 w-4 h-4" />
                  <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-xl">📲</div>
                    <div>
                      <p class="font-extrabold text-slate-800 text-sm">Thanh toán qua Ví MoMo (TEST / Sandbox)</p>
                      <p class="text-xs text-slate-400">Ứng dụng Ví MoMo / Mã QR MoMo Sandbox</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- 4. VOUCHER -->
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
              <h2 class="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <span>🎟️ Voucher</span>
              </h2>
              
              <div class="space-y-4">
                <!-- Voucher Input -->
                <div class="flex gap-2">
                  <input 
                    type="text" 
                    v-model="voucherCodeInput" 
                    placeholder="Nhập mã voucher..." 
                    class="pe-input py-2 text-xs flex-grow"
                  />
                  <button 
                    @click="applyVoucherByCode" 
                    class="btn btn-sm bg-[#087443] hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold px-4"
                  >
                    Áp dụng
                  </button>
                </div>
                
                <!-- Selected Voucher Badge -->
                <div v-if="selectedPromotion" class="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-mono font-black text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-200/50">
                      {{ selectedPromotion.ma_khuyen_mai }}
                    </span>
                    <span class="text-emerald-700 font-bold ml-2">
                      {{ selectedPromotion.loai_giam_gia === 'percentage' ? `Giảm ${selectedPromotion.gia_tri_giam}%` : `Giảm ${formatPrice(selectedPromotion.gia_tri_giam)}` }}
                    </span>
                    <p class="text-[10px] text-slate-400 mt-1">Đã áp dụng thành công (Giảm {{ formatPrice(discountVoucher) }})</p>
                  </div>
                  <button @click="selectedPromotion = null" class="text-red-500 hover:text-red-700 font-bold text-sm">Gỡ</button>
                </div>

                <!-- Available Vouchers List -->
                <div class="border-t border-slate-100 pt-3">
                  <p class="text-xs font-bold text-slate-500 mb-2">Hoặc chọn voucher khả dụng</p>
                  <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <div v-if="eligiblePromotions.length === 0" class="text-xs text-slate-400 italic">
                      Không có voucher nào đủ điều kiện.
                    </div>
                    <div 
                      v-for="promo in eligiblePromotions" 
                      :key="promo.id"
                      class="border border-slate-100 rounded-xl p-3 flex justify-between items-center transition"
                      :class="selectedPromotion && selectedPromotion.id === promo.id ? 'border-emerald-600 bg-emerald-50/10' : 'hover:border-slate-200'"
                    >
                      <div class="text-left">
                        <span class="font-mono font-bold text-xs text-emerald-800">{{ promo.ma_khuyen_mai }}</span>
                        <p class="text-[10px] text-slate-400 mt-0.5">
                          {{ promo.loai_giam_gia === 'percentage' ? `Giảm ${promo.gia_tri_giam}%` : `Giảm ${formatPrice(promo.gia_tri_giam)}` }} · Đơn tối thiểu: {{ formatPrice(promo.gia_tri_don_toi_thieu) }}
                        </p>
                      </div>
                      <button 
                        v-if="!selectedPromotion || selectedPromotion.id !== promo.id"
                        @click="selectVoucher(promo)"
                        class="btn btn-xs bg-[#087443] hover:bg-[#064E3B] text-white rounded-lg text-[10px] font-bold px-3"
                      >
                        Dùng
                      </button>
                      <span v-else class="text-[10px] text-emerald-600 font-bold">Đang dùng</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. SỬ DỤNG XU -->
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
              <h2 class="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <span>🪙 Sử dụng Xu</span>
              </h2>
              
              <div class="space-y-4">
                <div class="text-xs font-medium text-slate-600 flex justify-between">
                  <span>Bạn đang có:</span>
                  <span class="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">🪙 {{ userPoints }} Xu</span>
                </div>
                
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số Xu muốn sử dụng</label>
                  <div class="flex gap-2">
                    <input 
                      type="number" 
                      v-model.number="usePointsInput" 
                      min="0" 
                      :max="maxPointsAllowed" 
                      @input="validatePointsInput"
                      placeholder="Nhập số xu..." 
                      class="pe-input py-2 text-xs flex-grow"
                    />
                    <button 
                      @click="useMaxPoints" 
                      class="btn btn-sm btn-outline border-slate-200 text-slate-600 rounded-xl text-xs px-3"
                    >
                      Dùng tối đa
                    </button>
                  </div>
                </div>

                <div class="flex justify-between items-center text-xs pt-1">
                  <span class="text-slate-500 font-medium">Giảm được:</span>
                  <span class="font-extrabold text-emerald-600">-{{ formatPrice(discountPoints) }}</span>
                </div>

                <button 
                  @click="togglePointsUsage" 
                  class="w-full btn btn-sm rounded-xl font-bold text-xs text-white"
                  :class="usePointsChecked ? 'btn-error' : 'bg-[#087443] hover:bg-[#064E3B]'"
                >
                  {{ usePointsChecked ? 'Hủy sử dụng Xu' : 'Xác nhận dùng Xu' }}
                </button>
              </div>
            </div>

            <!-- 6. Ghi chú đơn hàng -->
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-base font-extrabold text-[#064E3B] flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-600 text-lg">edit_note</span>
                  <span>📝 Ghi chú đơn hàng</span>
                </h2>
                <span class="text-xs font-semibold" :class="orderNote?.length >= 190 ? 'text-amber-600' : 'text-slate-400'">
                  {{ orderNote?.length || 0 }}/200
                </span>
              </div>
              
              <div class="relative">
                <textarea
                  v-model="orderNote"
                  maxlength="200"
                  rows="3"
                  class="w-full p-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-[#087443] focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none leading-relaxed"
                  placeholder="Nhập ghi chú cho người bán..."
                ></textarea>
              </div>
              <p class="text-[11px] text-slate-400 mt-2 font-light">
                💡 Bạn có thể để lại dặn dò cho nhân viên giao hàng hoặc shipper (không bắt buộc).
              </p>
            </div>
          </div>

          <!-- BÊN PHẢI: Tóm tắt đơn hàng (1fr - sticky) -->
          <div class="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 class="text-base font-extrabold text-slate-800 mb-4">🛒 Tóm tắt đơn hàng</h2>
              
              <!-- Sản phẩm & Số lượng -->
              <div class="py-3 flex gap-3 items-center border-b border-slate-50 pb-4">
                <img 
                  referrerpolicy="no-referrer"
                  :src="product.image || `/images/product-missing.svg`" 
                  class="w-12 h-12 object-contain rounded-lg border border-slate-100 bg-slate-50 flex-shrink-0" 
                  @error="(e) => e.target.src = `/images/product-missing.svg`"
                />
                <div class="flex-grow min-w-0 text-left">
                  <h4 class="font-bold text-slate-800 text-xs truncate">{{ product.title }}</h4>
                  <p class="text-[10px] text-slate-400">SL: 1 × {{ formatPrice(product.flash_sale_price || product.price) }}</p>
                </div>
                <span class="font-bold text-xs text-slate-700">{{ formatPrice(product.flash_sale_price || product.price) }}</span>
              </div>

              <!-- Chi tiết tính tổng tiền -->
              <div class="border-t border-slate-50 pt-4 space-y-3">
                <div class="flex justify-between text-slate-500 text-xs">
                  <span>Tạm tính</span>
                  <span>{{ formatPrice(totalPrice) }}</span>
                </div>
                <div class="flex justify-between text-slate-500 text-xs">
                  <span>Vận chuyển</span>
                  <span class="text-emerald-600 font-bold">Miễn phí</span>
                </div>
                <div v-if="selectedPromotion" class="flex justify-between text-slate-500 text-xs">
                  <span>Giảm Voucher</span>
                  <span class="text-emerald-600 font-bold">-{{ formatPrice(discountVoucher) }}</span>
                </div>
                <div v-if="usePointsChecked && discountPoints > 0" class="flex justify-between text-slate-500 text-xs">
                  <span>Giảm từ Xu</span>
                  <span class="text-emerald-600 font-bold">-{{ formatPrice(discountPoints) }}</span>
                </div>
                <div class="border-t border-dashed border-slate-200 pt-3 flex justify-between font-black text-sm text-slate-800">
                  <span>Tổng thanh toán</span>
                  <span class="text-[#087443] text-base">{{ formatPrice(totalPayment) }}</span>
                </div>
              </div>

              <!-- Nút xác nhận đặt hàng -->
              <button 
                @click="handleCreateOrder" 
                :disabled="addresses.length === 0" 
                class="w-full bg-[#087443] hover:bg-[#064E3B] text-white font-extrabold py-3.5 rounded-xl shadow-lg mt-6 flex justify-center items-center text-sm disabled:opacity-50 transition-all"
              >
                XÁC NHẬN ĐẶT HÀNG
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
              <div class="flex flex-col gap-1.5 text-left">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên người nhận <span class="text-red-500">*</span></label>
                <input v-model="tempRecipientName" type="text" class="pe-input" placeholder="Nhập tên người nhận hàng..." />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5 text-left">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại địa chỉ</label>
                  <select v-model="tempLabel" class="pe-input">
                    <option value="Nhà riêng">Nhà riêng</option>
                    <option value="Văn phòng">Văn phòng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div class="flex flex-col gap-1.5 text-left">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại <span class="text-red-500">*</span></label>
                  <input v-model="tempPhone" type="text" class="pe-input" placeholder="Nhập số điện thoại nhận hàng..." />
                </div>
              </div>

              <div class="flex flex-col gap-1.5 text-left">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỉnh / Thành phố <span class="text-red-500">*</span></label>
                <select v-model="tempProvinceCode" @change="onProvinceChange" class="pe-input">
                  <option value="" disabled>Chọn Tỉnh/Thành phố</option>
                  <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5 text-left">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Quận / Huyện <span class="text-red-500">*</span></label>
                <select v-model="tempDistrictCode" @change="onDistrictChange" :disabled="!tempProvinceCode" class="pe-input disabled:bg-slate-100 disabled:opacity-50">
                  <option value="" disabled>Chọn Quận/Huyện</option>
                  <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5 text-left">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Phường / Xã <span class="text-red-500">*</span></label>
                <select v-model="tempWardCode" @change="onWardChange" :disabled="!tempDistrictCode" class="pe-input disabled:bg-slate-100 disabled:opacity-50">
                  <option value="" disabled>Chọn Phường/Xã</option>
                  <option v-for="w in wards" :key="w.code" :value="w.code">{{ w.name }}</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5 text-left">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ chi tiết <span class="text-red-500">*</span></label>
                <input v-model="tempAddressDetail" type="text" class="pe-input" placeholder="Số nhà, Tên đường..." />
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