<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

import { useAuth } from '../composables/useAuth';
import { ref, computed, onMounted, onUnmounted } from "vue";
import UserService from '../services/user.service';
import OrderService from '../services/order.service';
import AddressService from '../services/address.service';
import LocationService from '../services/location.service';
import ApiClient from '../services/api.service';
import { useRouter } from 'vue-router';
import { push } from 'notivue';

const router = useRouter();
const { logOut } = useAuth();
const userService = new UserService();
const orderService = new OrderService();
const addressService = new AddressService();
const api = ApiClient();

const user = ref({});
const orders = ref([]);
const addresses = ref([]);
const bankAccounts = ref([]);
const pointsInfo = ref({ points: 0, rank: 'bronze', totalEarned: 0, totalSpent: 0 });
const pointHistory = ref([]);
const pointFilter = ref('ALL'); // ALL, EARN, SPEND

const user_id = computed(() => localStorage.getItem("id"));
const loading = ref(true);
const activeTab = ref('info'); // info, address, bank, points, orders, security

// Edit User State
const isEditingUser = ref(false);
const editFirstName = ref('');
const editLastName = ref('');
const editEmail = ref('');
const editPhone = ref('');
const editBirthday = ref('');
const editGender = ref(true);

// Password Change State
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isChangingPassword = ref(false);

// Avatar Change State
const avatarInputRef = ref(null);
const isUploadingAvatar = ref(false);

const triggerAvatarUpload = () => {
  if (avatarInputRef.value) {
    avatarInputRef.value.click();
  }
};

const onAvatarFileSelected = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    push.error("Kích thước ảnh tối đa là 5MB!");
    return;
  }
  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64Avatar = event.target.result;
    try {
      isUploadingAvatar.value = true;
      await userService.update(user_id.value, { avatar: base64Avatar });
      user.value.avatar = base64Avatar;
      localStorage.setItem("avatar", base64Avatar);
      push.success("Đổi ảnh đại diện thành công! 🎉");
    } catch (err) {
      console.error("Lỗi cập nhật avatar:", err);
      push.error("Không thể cập nhật ảnh đại diện!");
    } finally {
      isUploadingAvatar.value = false;
      if (avatarInputRef.value) {
        avatarInputRef.value.value = "";
      }
    }
  };
  reader.readAsDataURL(file);
};

// Address Modal State
const showAddressModal = ref(false);
const isEditingAddr = ref(false);
const editingAddrId = ref(null);
const tempLabel = ref('Nhà riêng');
const tempRecipientName = ref('');
const tempPhone = ref('');
const tempProvinceCode = ref('');
const tempProvinceName = ref('');
const tempDistrictCode = ref('');
const tempDistrictName = ref('');
const tempWardCode = ref('');
const tempWardName = ref('');
const tempAddressDetail = ref('');
const tempIsDefault = ref(false);

const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);

// Bank Account Modal State
const showBankModal = ref(false);
const isEditingBank = ref(false);
const editingBankId = ref(null);
const tempBankName = ref('MB Bank (Ngân hàng Quân Đội)');
const tempAccountName = ref('');
const tempAccountNumber = ref('');
const tempBankIsDefault = ref(false);

const popularBanks = [
  "MB Bank (Ngân hàng Quân Đội)",
  "Vietcombank (VCB)",
  "Techcombank (TCB)",
  "BIDV",
  "VietinBank",
  "VPBank",
  "ACB",
  "TPBank",
  "Sacombank",
  "VIB",
  "Agribank"
];

// Order Detail Modal State
const selectedOrder = ref(null);
const showOrderDetailModal = ref(false);

// Return / Refund Modal State
const showReturnModal = ref(false);
const orderToReturn = ref(null);
const returnReason = ref('Sản phẩm bị lỗi / vỡ hỏng do vận chuyển');
const returnNote = ref('');
const isSubmittingReturn = ref(false);
const returnReasonOptions = [
  'Sản phẩm bị lỗi / vỡ hỏng do vận chuyển',
  'Giao sai sản phẩm / sai dung tích',
  'Sản phẩm cận hạn sử dụng (<6 tháng)',
  'Bị kích ứng mẩn đỏ khi sử dụng (kèm ảnh da)',
  'Khác (Cần ghi rõ trong mô tả)'
];

let profilePollInterval = null;

const fetchData = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const userData = await userService.getUser(user_id.value);
    user.value = userData;

    if (!isEditingUser.value) {
      editFirstName.value = userData.first_name || '';
      editLastName.value = userData.last_name || '';
      editEmail.value = userData.email || '';
      editPhone.value = userData.phone || '';
      editBirthday.value = userData.birthday ? userData.birthday.split('T')[0] : '';
      editGender.value = userData.gender !== false;
    }

    // Load Addresses
    if (!silent) {
      addresses.value = await addressService.getAddresses();
    }

    // Load Bank Accounts
    try {
      const resBanks = await api.get('/api/user/banks');
      bankAccounts.value = resBanks.data || [];
    } catch (e) {
      console.error("Lỗi lấy ngân hàng:", e);
    }

    // Load Points
    try {
      const resPoints = await api.get('/api/user/points');
      pointsInfo.value = resPoints.data || { points: 0, rank: 'bronze', totalEarned: 0, totalSpent: 0 };

      const resHistory = await api.get('/api/user/points/history');
      pointHistory.value = resHistory.data || [];
    } catch (e) {
      console.error("Lỗi lấy điểm:", e);
    }

    // Load Orders
    const resOrders = await orderService.getAllOrders({ user_id: user_id.value });
    orders.value = Array.isArray(resOrders) ? resOrders : (resOrders?.orders || []);

    // Load Location Provinces
    if (!silent) {
      provinces.value = await LocationService.getProvinces();
    }
  } catch (error) {
    console.error("Lỗi fetchData:", error);
    if (!silent) push.error("Không thể tải thông tin hồ sơ");
  } finally {
    if (!silent) loading.value = false;
  }
};

const handleUpdateUser = async () => {
  try {
    const payload = {
      first_name: editFirstName.value,
      last_name: editLastName.value,
      email: editEmail.value,
      phone: editPhone.value,
      birthday: editBirthday.value,
      gender: editGender.value,
    };
    await userService.update(user_id.value, payload);
    push.success("Cập nhật thông tin cá nhân thành công!");
    isEditingUser.value = false;
    fetchData();
  } catch (err) {
    console.error(err);
    push.error("Cập nhật thất bại. Vui lòng kiểm tra lại!");
  }
};

const handleChangePassword = async () => {
  if (!currentPassword.value || !newPassword.value) {
    push.warning("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới!");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    push.warning("Mật khẩu xác nhận không khớp!");
    return;
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+={}\[\]:;<>,.~]).{8,32}$/;
  if (!passwordRegex.test(newPassword.value)) {
    push.warning("Mật khẩu mới phải từ 8-32 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&#...)");
    return;
  }
  try {
    isChangingPassword.value = true;
    await userService.update(user_id.value, {
      currentPassword: currentPassword.value,
      password: newPassword.value
    });
    push.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    
    // Đăng xuất tự động
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "/user/login";
    }, 1500);
  } catch (err) {
    console.error(err);
    push.error(err.response?.data?.message || "Đổi mật khẩu thất bại!");
  } finally {
    isChangingPassword.value = false;
  }
};

// === ADDRESS METHODS ===
const onProvinceChange = async () => {
  tempDistrictCode.value = "";
  tempWardCode.value = "";
  districts.value = [];
  wards.value = [];
  if (tempProvinceCode.value) {
    districts.value = await LocationService.getDistricts(tempProvinceCode.value);
  }
};

const onDistrictChange = async () => {
  tempWardCode.value = "";
  wards.value = [];
  if (tempDistrictCode.value) {
    wards.value = await LocationService.getWards(tempDistrictCode.value);
  }
};

const openAddAddrModal = () => {
  isEditingAddr.value = false;
  editingAddrId.value = null;
  tempLabel.value = "Nhà riêng";
  tempRecipientName.value = `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim();
  tempPhone.value = user.value.phone || '';
  tempProvinceCode.value = '';
  tempDistrictCode.value = '';
  tempWardCode.value = '';
  tempAddressDetail.value = '';
  tempIsDefault.value = addresses.value.length === 0;
  districts.value = [];
  wards.value = [];
  showAddressModal.value = true;
};

const openEditAddrModal = async (addr) => {
  isEditingAddr.value = true;
  editingAddrId.value = addr._id;
  tempLabel.value = addr.label || "Nhà riêng";
  tempRecipientName.value = addr.recipientName || '';
  tempPhone.value = addr.phone || '';
  tempProvinceCode.value = addr.provinceCode || '';
  tempDistrictCode.value = addr.districtCode || '';
  tempWardCode.value = addr.wardCode || '';
  tempAddressDetail.value = addr.addressDetail || '';
  tempIsDefault.value = addr.isDefault || false;

  if (tempProvinceCode.value) {
    districts.value = await LocationService.getDistricts(tempProvinceCode.value);
  }
  if (tempDistrictCode.value) {
    wards.value = await LocationService.getWards(tempDistrictCode.value);
  }
  showAddressModal.value = true;
};

const saveAddress = async () => {
  if (!tempProvinceCode.value || !tempDistrictCode.value || !tempWardCode.value || !tempAddressDetail.value.trim() || !tempPhone.value.trim()) {
    push.warning("Vui lòng điền đầy đủ Tỉnh, Huyện, Xã, Địa chỉ chi tiết và Số điện thoại!");
    return;
  }

  const p = provinces.value.find(x => x.code == tempProvinceCode.value);
  const d = districts.value.find(x => x.code == tempDistrictCode.value);
  const w = wards.value.find(x => x.code == tempWardCode.value);

  const payload = {
    label: tempLabel.value,
    recipientName: tempRecipientName.value,
    phone: tempPhone.value,
    provinceCode: String(tempProvinceCode.value),
    provinceName: p ? p.name : '',
    districtCode: String(tempDistrictCode.value),
    districtName: d ? d.name : '',
    wardCode: String(tempWardCode.value),
    wardName: w ? w.name : '',
    addressDetail: tempAddressDetail.value,
    isDefault: tempIsDefault.value
  };

  try {
    if (isEditingAddr.value) {
      await addressService.updateAddress(editingAddrId.value, payload);
      push.success("Cập nhật địa chỉ thành công!");
    } else {
      await addressService.addAddress(payload);
      push.success("Thêm địa chỉ thành công!");
    }
    showAddressModal.value = false;
    addresses.value = await addressService.getAddresses();
  } catch (err) {
    console.error(err);
    push.error("Lỗi khi lưu địa chỉ!");
  }
};

const handleSetDefaultAddr = async (id) => {
  try {
    await addressService.setDefaultAddress(id);
    push.success("Đã đặt địa chỉ mặc định!");
    addresses.value = await addressService.getAddresses();
  } catch (err) {
    console.error(err);
    push.error("Không thể đặt địa chỉ mặc định");
  }
};

const handleDeleteAddr = async (id) => {
  if (confirm("Xác nhận xóa địa chỉ này?")) {
    try {
      await addressService.deleteAddress(id);
      push.success("Đã xóa địa chỉ thành công!");
      addresses.value = await addressService.getAddresses();
    } catch (err) {
      console.error(err);
      push.error("Không thể xóa địa chỉ");
    }
  }
};

// === BANK ACCOUNT METHODS ===
const openAddBankModal = () => {
  isEditingBank.value = false;
  editingBankId.value = null;
  tempBankName.value = popularBanks[0];
  tempAccountName.value = `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim().toUpperCase();
  tempAccountNumber.value = '';
  tempBankIsDefault.value = bankAccounts.value.length === 0;
  showBankModal.value = true;
};

const openEditBankModal = (bank) => {
  isEditingBank.value = true;
  editingBankId.value = bank._id;
  tempBankName.value = bank.bank_name;
  tempAccountName.value = bank.account_name;
  tempAccountNumber.value = bank.account_number_raw || '';
  tempBankIsDefault.value = bank.isDefault || false;
  showBankModal.value = true;
};

const saveBankAccount = async () => {
  if (!tempBankName.value || !tempAccountName.value.trim() || !tempAccountNumber.value.trim()) {
    push.warning("Vui lòng điền Tên ngân hàng, Tên chủ tài khoản và Số tài khoản!");
    return;
  }

  const payload = {
    bank_name: tempBankName.value,
    account_name: tempAccountName.value.trim().toUpperCase(),
    account_number: tempAccountNumber.value.trim(),
    isDefault: tempBankIsDefault.value
  };

  try {
    if (isEditingBank.value) {
      await api.put(`/api/user/banks/${editingBankId.value}`, payload);
      push.success("Cập nhật ngân hàng thành công!");
    } else {
      await api.post('/api/user/banks', payload);
      push.success("Liên kết ngân hàng thành công!");
    }
    showBankModal.value = false;
    const res = await api.get('/api/user/banks');
    bankAccounts.value = res.data || [];
  } catch (err) {
    console.error(err);
    push.error("Không thể lưu thông tin ngân hàng!");
  }
};

const handleSetDefaultBank = async (id) => {
  try {
    await api.patch(`/api/user/banks/${id}/default`);
    push.success("Đã đặt ngân hàng mặc định!");
    const res = await api.get('/api/user/banks');
    bankAccounts.value = res.data || [];
  } catch (err) {
    console.error(err);
    push.error("Lỗi đặt ngân hàng mặc định");
  }
};

const handleDeleteBank = async (id) => {
  if (confirm("Xác nhận xóa tài khoản ngân hàng này?")) {
    try {
      await api.delete(`/api/user/banks/${id}`);
      push.success("Đã xóa tài khoản ngân hàng!");
      const res = await api.get('/api/user/banks');
      bankAccounts.value = res.data || [];
    } catch (err) {
      console.error(err);
      push.error("Lỗi xóa ngân hàng");
    }
  }
};

// Filtered Points History
const filteredPointHistory = computed(() => {
  if (pointFilter.value === 'EARN') {
    return pointHistory.value.filter(h => h.type === 'EARN' || (h.type === 'ADJUST' && h.amount > 0));
  }
  if (pointFilter.value === 'SPEND') {
    return pointHistory.value.filter(h => h.type === 'SPEND' || (h.type === 'ADJUST' && h.amount < 0));
  }
  return pointHistory.value;
});

const getRankBadgeClass = (rank) => {
  switch (rank?.toLowerCase()) {
    case 'diamond': return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'gold': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'silver': return 'bg-slate-200 text-slate-700 border-slate-300';
    default: return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
};

const getRankLabel = (rank) => {
  switch (rank?.toLowerCase()) {
    case 'diamond': return '💎 Hạng Kim Cương';
    case 'gold': return '🥇 Hạng Vàng';
    case 'silver': return '🥈 Hạng Bạc';
    default: return '🥉 Hạng Đồng';
  }
};

const formatPrice = (price) => {
  if (!price) return "0 đ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN');
};

const getOrderStatusInfo = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return { label: 'Chờ xác nhận', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'confirmed':
      return { label: 'Đã xác nhận', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'shipping':
      return { label: '🚚 Đang giao hàng', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'delivered':
      return { label: '✓ Đã nhận hàng', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'completed':
      return { label: '✓ Đã hoàn thành', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'return_requested':
      return { label: '⏳ Chờ duyệt hoàn hàng', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200' };
    case 'returning':
      return { label: '🚚 Đang chuyển hoàn về kho', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'returned':
      return { label: '📦 Đã nhận hàng hoàn', badgeClass: 'bg-slate-200 text-slate-800 border-slate-300' };
    case 'refunded':
      return { label: '💰 Đã hoàn tiền', badgeClass: 'bg-teal-100 text-teal-800 border-teal-200' };
    case 'cancelled':
      return { label: '✕ Đã hủy đơn', badgeClass: 'bg-red-100 text-red-700 border-red-200' };
    default:
      return { label: status || 'N/A', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
};

const handleCancelOrder = async (order) => {
  if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${order.order_code || order._id.slice(-8).toUpperCase()} không?`)) return;
  try {
    await orderService.updateOrder(order._id, { status: 'cancelled' });
    push.success('Hủy đơn hàng thành công!');
    fetchData();
  } catch (err) {
    console.error(err);
    push.error(err.response?.data?.message || 'Không thể hủy đơn hàng!');
  }
};

const formatAddress = (addr) => {
  if (!addr) return '---';
  if (typeof addr === 'string') return addr;
  if (addr.addressDetail) {
    return `${addr.addressDetail}${addr.wardName ? ', ' + addr.wardName : ''}${addr.districtName ? ', ' + addr.districtName : ''}${addr.provinceName ? ', ' + addr.provinceName : ''}`;
  }
  return '---';
};

const openOrderDetail = (order) => {
  selectedOrder.value = order;
  showOrderDetailModal.value = true;
};

const openReturnModal = (order) => {
  orderToReturn.value = order;
  returnReason.value = 'Sản phẩm bị lỗi / vỡ hỏng do vận chuyển';
  returnNote.value = '';
  showReturnModal.value = true;
};

const submitReturnRequest = async () => {
  if (!orderToReturn.value) return;
  try {
    isSubmittingReturn.value = true;
    await orderService.updateOrder(orderToReturn.value._id, {
      status: 'return_requested',
      return_reason: returnReason.value,
      return_note: returnNote.value,
      return_date: new Date().toISOString()
    });
    push.success('Gửi yêu cầu Trả hàng / Hoàn tiền thành công! Quản trị viên sẽ xử lý sớm nhất.');
    showReturnModal.value = false;
    showOrderDetailModal.value = false;
    fetchData();
  } catch (err) {
    console.error(err);
    push.error(err.response?.data?.message || 'Không thể gửi yêu cầu hoàn hàng!');
  } finally {
    isSubmittingReturn.value = false;
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    fetchData(true);
  }
};

onMounted(() => {
  fetchData();
  profilePollInterval = setInterval(() => {
    fetchData(true);
  }, 15000);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (profilePollInterval) clearInterval(profilePollInterval);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <div class="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col font-sans">
    <Header />

    <main class="flex-grow max-w-7xl mx-auto px-4 md:px-8 py-8 w-full">
      <div v-if="loading" class="flex justify-center items-center py-32">
        <span class="loading loading-spinner text-[#087443] loading-lg"></span>
      </div>

      <div v-else class="space-y-8">
        
        <!-- HEADER OVERVIEW BANNER CARD (PREMIUM HIGH CONTRAST) -->
        <div class="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-left border border-emerald-500/30" style="background: linear-gradient(135deg, #043825 0%, #065F46 50%, #064E3B 100%);">
          <!-- Ambient Background Circles -->
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none"></div>
          <div class="absolute right-4 bottom-2 opacity-5 pointer-events-none text-white select-none">
            <span class="material-symbols-outlined" style="font-size: 200px;">account_circle</span>
          </div>

          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <!-- Left: Avatar & User Identity -->
            <div class="flex items-center gap-5 sm:gap-6">
              <!-- Avatar Circle -->
              <div class="relative group cursor-pointer shrink-0" @click="triggerAvatarUpload" title="Bấm vào hình tròn để đổi ảnh đại diện">
                <input 
                  type="file" 
                  ref="avatarInputRef" 
                  accept="image/*" 
                  class="hidden" 
                  @change="onAvatarFileSelected" 
                />
                
                <div class="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-white/20 group-hover:border-emerald-300 transition-all duration-300 bg-white">
                  <img 
                    :src="user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user.first_name || 'U') + ' ' + (user.last_name || ''))}&background=087443&color=fff&bold=true`" 
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    alt="User Avatar"
                  />
                  
                  <!-- Hover Overlay with Camera Icon -->
                  <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                    <span class="material-symbols-outlined text-2xl mb-0.5">photo_camera</span>
                    <span class="text-[9px] font-black tracking-wider uppercase">Đổi ảnh</span>
                  </div>

                  <!-- Loading spinner when uploading -->
                  <div v-if="isUploadingAvatar" class="absolute inset-0 bg-black/75 flex items-center justify-center">
                    <span class="loading loading-spinner loading-sm text-white"></span>
                  </div>
                </div>

                <!-- Camera badge at bottom-right corner -->
                <button 
                  type="button"
                  class="absolute -bottom-1 -right-1 w-7 h-7 bg-white text-emerald-800 border-2 border-emerald-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer" 
                  title="Tải ảnh mới">
                  <span class="material-symbols-outlined text-sm font-bold">photo_camera</span>
                </button>
              </div>

              <!-- User Information -->
              <div class="space-y-2">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 class="text-2xl md:text-3xl font-black tracking-tight" style="color: #FFFFFF !important; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    {{ user.first_name || 'Khách hàng' }} {{ user.last_name || '' }}
                  </h1>
                  <span class="px-3 py-1 text-xs font-black rounded-full border shadow-sm flex items-center gap-1 bg-amber-400/20 text-amber-300 border-amber-300/40 backdrop-blur-md">
                    {{ getRankLabel(user.rank) }}
                  </span>
                </div>

                <div class="flex items-center gap-2 flex-wrap text-xs">
                  <span class="px-2.5 py-1 rounded-lg bg-black/25 text-white/95 font-medium border border-white/10 flex items-center gap-1.5 backdrop-blur-xs">
                    <span>📧</span>
                    <span>{{ user.email || user.username }}</span>
                  </span>
                  <span class="px-2.5 py-1 rounded-lg bg-black/25 text-white/95 font-medium border border-white/10 flex items-center gap-1.5 backdrop-blur-xs">
                    <span>📱</span>
                    <span>{{ user.phone || 'Chưa cập nhật SĐT' }}</span>
                  </span>
                </div>

                <p class="text-[11px] font-medium flex items-center gap-1.5" style="color: #A7F3D0 !important;">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Thành viên SkinMedi AI từ: {{ formatDate(user.createdAt).split(',')[0] }}</span>
                </p>
              </div>
            </div>

            <!-- Right: Quick Stat Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <!-- Points -->
              <div class="bg-white/15 hover:bg-white/20 transition-all duration-200 border border-white/25 p-3.5 md:p-4 rounded-2xl text-center backdrop-blur-md shadow-lg flex flex-col justify-center items-center min-w-[100px]">
                <span class="font-black text-xl md:text-2xl block" style="color: #FDE047 !important; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  ⭐ {{ pointsInfo.points }}
                </span>
                <span class="text-[10px] md:text-[11px] uppercase tracking-wider font-extrabold mt-1 block" style="color: #D1FAE5 !important;">
                  Điểm Xu
                </span>
              </div>

              <!-- Orders -->
              <div class="bg-white/15 hover:bg-white/20 transition-all duration-200 border border-white/25 p-3.5 md:p-4 rounded-2xl text-center backdrop-blur-md shadow-lg flex flex-col justify-center items-center min-w-[100px]">
                <span class="font-black text-xl md:text-2xl block" style="color: #FFFFFF !important; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  🛍 {{ orders.length }}
                </span>
                <span class="text-[10px] md:text-[11px] uppercase tracking-wider font-extrabold mt-1 block" style="color: #D1FAE5 !important;">
                  Đơn hàng
                </span>
              </div>

              <!-- Addresses -->
              <div class="bg-white/15 hover:bg-white/20 transition-all duration-200 border border-white/25 p-3.5 md:p-4 rounded-2xl text-center backdrop-blur-md shadow-lg flex flex-col justify-center items-center min-w-[100px]">
                <span class="font-black text-xl md:text-2xl block" style="color: #FFFFFF !important; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  📍 {{ addresses.length }}
                </span>
                <span class="text-[10px] md:text-[11px] uppercase tracking-wider font-extrabold mt-1 block" style="color: #D1FAE5 !important;">
                  Địa chỉ
                </span>
              </div>

              <!-- Banks -->
              <div class="bg-white/15 hover:bg-white/20 transition-all duration-200 border border-white/25 p-3.5 md:p-4 rounded-2xl text-center backdrop-blur-md shadow-lg flex flex-col justify-center items-center min-w-[100px]">
                <span class="font-black text-xl md:text-2xl block" style="color: #FFFFFF !important; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  💳 {{ bankAccounts.length }}
                </span>
                <span class="text-[10px] md:text-[11px] uppercase tracking-wider font-extrabold mt-1 block" style="color: #D1FAE5 !important;">
                  Ngân hàng
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- MAIN DASHBOARD NAVIGATION TABS & CONTENT LAYOUT -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
          
          <!-- LEFT SIDEBAR TAB BUTTONS -->
          <div class="lg:col-span-3 bg-white border border-[#EBE7DF] rounded-3xl p-3 shadow-xs space-y-1">
            <button 
              @click="activeTab = 'info'" 
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all"
              :class="activeTab === 'info' ? 'bg-[#087443] text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#087443]'"
            >
              <span class="material-symbols-outlined text-lg">person</span>
              <span>Thông tin cá nhân</span>
            </button>

            <button 
              @click="activeTab = 'address'" 
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all"
              :class="activeTab === 'address' ? 'bg-[#087443] text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#087443]'"
            >
              <span class="material-symbols-outlined text-lg">location_on</span>
              <span>Địa chỉ giao hàng ({{ addresses.length }})</span>
            </button>

            <button 
              @click="activeTab = 'bank'" 
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all"
              :class="activeTab === 'bank' ? 'bg-[#087443] text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#087443]'"
            >
              <span class="material-symbols-outlined text-lg">account_balance</span>
              <span>Ngân hàng & Thanh toán</span>
            </button>

            <button 
              @click="activeTab = 'points'" 
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all"
              :class="activeTab === 'points' ? 'bg-[#087443] text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#087443]'"
            >
              <span class="material-symbols-outlined text-lg">stars</span>
              <span>Điểm SkinMedi ({{ pointsInfo.points }} Xu)</span>
            </button>

            <button 
              @click="activeTab = 'orders'" 
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all"
              :class="activeTab === 'orders' ? 'bg-[#087443] text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#087443]'"
            >
              <span class="material-symbols-outlined text-lg">shopping_bag</span>
              <span>Đơn hàng của tôi ({{ orders.length }})</span>
            </button>

            <button 
              @click="activeTab = 'security'" 
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all"
              :class="activeTab === 'security' ? 'bg-[#087443] text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-[#087443]'"
            >
              <span class="material-symbols-outlined text-lg">shield</span>
              <span>Bảo mật tài khoản</span>
            </button>

            <hr class="border-slate-100 my-2" />

            <button 
              @click="logOut" 
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
            >
              <span class="material-symbols-outlined text-lg">logout</span>
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>

          <!-- RIGHT CONTENT DISPLAY PANELS -->
          <div class="lg:col-span-9 space-y-6">

            <!-- TAB 1: THÔNG TIN CÁ NHÂN -->
            <div v-if="activeTab === 'info'" class="bg-white border border-[#EBE7DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 class="text-lg font-black text-[#064E3B] flex items-center gap-2">
                    <span class="material-symbols-outlined">badge</span>
                    <span>Thông tin cá nhân & Hồ sơ</span>
                  </h3>
                  <p class="text-xs text-slate-500">Quản lý tên, thông tin liên hệ và lộ trình chăm sóc da</p>
                </div>
                <button 
                  @click="isEditingUser = !isEditingUser" 
                  class="btn btn-sm btn-outline border-slate-300 text-xs font-bold rounded-xl"
                >
                  {{ isEditingUser ? 'Hủy chỉnh sửa' : '✏️ Chỉnh sửa' }}
                </button>
              </div>

              <!-- View / Edit Form -->
              <form @submit.prevent="handleUpdateUser" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Họ & Tên đệm</label>
                  <input v-model="editFirstName" :disabled="!isEditingUser" type="text" class="input input-bordered input-sm w-full rounded-xl text-xs" />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên</label>
                  <input v-model="editLastName" :disabled="!isEditingUser" type="text" class="input input-bordered input-sm w-full rounded-xl text-xs" />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input v-model="editEmail" :disabled="!isEditingUser" type="email" class="input input-bordered input-sm w-full rounded-xl text-xs bg-slate-50" />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                  <input v-model="editPhone" :disabled="!isEditingUser" type="text" class="input input-bordered input-sm w-full rounded-xl text-xs" />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày sinh</label>
                  <input v-model="editBirthday" :disabled="!isEditingUser" type="date" class="input input-bordered input-sm w-full rounded-xl text-xs" />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Giới tính</label>
                  <select v-model="editGender" :disabled="!isEditingUser" class="select select-bordered select-sm w-full rounded-xl text-xs">
                    <option :value="true">Nam</option>
                    <option :value="false">Nữ</option>
                  </select>
                </div>

                <div v-if="isEditingUser" class="col-span-full flex justify-end gap-2 pt-2">
                  <button type="button" @click="isEditingUser = false" class="btn btn-ghost btn-sm rounded-xl text-xs">Hủy</button>
                  <button type="submit" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl px-6 text-xs font-bold">
                    💾 Lưu thay đổi
                  </button>
                </div>
              </form>

              <!-- Hồ sơ da liễu -->
              <div class="border-t border-slate-100 pt-6 space-y-3">
                <h4 class="text-sm font-extrabold text-[#064E3B] flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-600">dermatology</span>
                  <span>Hồ sơ phân tích da liễu AI</span>
                </h4>
                <div class="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span class="text-slate-400 font-bold block mb-1">Loại da của bạn:</span>
                    <span class="font-extrabold text-emerald-800 text-sm">
                      {{ user.skin_profile?.skin_type || 'Chưa thực hiện test da' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-slate-400 font-bold block mb-1">Tình trạng cần chăm sóc:</span>
                    <div class="flex flex-wrap gap-1">
                      <span v-for="c in (user.skin_profile?.conditions || [])" :key="c" class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                        {{ c }}
                      </span>
                      <span v-if="!user.skin_profile?.conditions?.length" class="text-slate-500 italic">Chưa ghi nhận</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 2: ĐỊA CHỈ GIAO HÀNG -->
            <div v-if="activeTab === 'address'" class="bg-white border border-[#EBE7DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 class="text-lg font-black text-[#064E3B] flex items-center gap-2">
                    <span class="material-symbols-outlined">location_on</span>
                    <span>Địa chỉ giao hàng</span>
                  </h3>
                  <p class="text-xs text-slate-500">Địa chỉ sẽ được đồng bộ trực tiếp với trang Thanh toán Checkout</p>
                </div>
                <button @click="openAddAddrModal" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl text-xs font-bold flex items-center gap-1">
                  <span>+ Thêm địa chỉ mới</span>
                </button>
              </div>

              <div class="space-y-4">
                <div 
                  v-for="addr in addresses" 
                  :key="addr._id" 
                  class="p-5 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
                  :class="addr.isDefault ? 'border-emerald-600 bg-emerald-50/15' : 'border-slate-100 bg-white'"
                >
                  <div class="space-y-1.5">
                    <div class="flex items-center gap-2">
                      <span class="font-extrabold text-slate-800 text-sm">{{ addr.recipientName || user.first_name }}</span>
                      <span class="text-slate-400 font-bold">|</span>
                      <span class="font-bold text-slate-700">{{ addr.phone }}</span>
                      <span v-if="addr.isDefault" class="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-emerald-200">
                        Mặc định
                      </span>
                      <span class="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-md">
                        {{ addr.label || 'Nhà riêng' }}
                      </span>
                    </div>
                    <p class="text-slate-600 leading-relaxed font-light">
                      {{ addr.addressDetail }}, {{ addr.wardName }}, {{ addr.districtName }}, {{ addr.provinceName }}
                    </p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button v-if="!addr.isDefault" @click="handleSetDefaultAddr(addr._id)" class="btn btn-ghost btn-xs text-slate-600 hover:text-emerald-700 font-bold">
                      Thiết lập mặc định
                    </button>
                    <button @click="openEditAddrModal(addr)" class="btn btn-ghost btn-xs text-blue-600 font-bold">
                      Sửa
                    </button>
                    <button @click="handleDeleteAddr(addr._id)" class="btn btn-ghost btn-xs text-red-500 font-bold">
                      Xóa
                    </button>
                  </div>
                </div>

                <div v-if="addresses.length === 0" class="text-center py-10 text-slate-400 text-xs font-serif italic border border-dashed rounded-2xl">
                  Chưa có địa chỉ giao hàng nào. Vui lòng bấm vào nút "+ Thêm địa chỉ mới" ở trên.
                </div>
              </div>
            </div>

            <!-- TAB 3: NGÂN HÀNG & THANH TOÁN -->
            <div v-if="activeTab === 'bank'" class="bg-white border border-[#EBE7DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 class="text-lg font-black text-[#064E3B] flex items-center gap-2">
                    <span class="material-symbols-outlined">account_balance</span>
                    <span>Ngân hàng & Phương thức thanh toán</span>
                  </h3>
                  <p class="text-xs text-slate-500">Lưu tài khoản ngân hàng để nhận hoàn tiền hoặc lưu vết thanh toán</p>
                </div>
                <button @click="openAddBankModal" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl text-xs font-bold flex items-center gap-1">
                  <span>+ Thêm ngân hàng</span>
                </button>
              </div>

              <!-- Security Notice Banner -->
              <div class="flex items-start gap-3 bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                <span class="material-symbols-outlined text-amber-600 shrink-0">security</span>
                <p class="leading-relaxed">
                  <strong>Cam kết bảo mật:</strong> Thông tin ngân hàng chỉ dùng cho mục đích xác nhận thanh toán & hoàn tiền đơn hàng. SkinMedi AI tuyệt đối <strong>KHÔNG</strong> lưu trữ mã PIN, CVV hay mật khẩu ngân hàng của quý khách.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  v-for="bank in bankAccounts" 
                  :key="bank._id" 
                  class="p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 text-xs relative overflow-hidden"
                  :class="bank.isDefault ? 'border-emerald-600 bg-gradient-to-br from-emerald-50/30 to-white' : 'border-slate-100 bg-white'"
                >
                  <div class="space-y-2">
                    <div class="flex justify-between items-start">
                      <div class="flex items-center gap-2">
                        <span class="text-xl">🏦</span>
                        <span class="font-extrabold text-slate-800 text-sm">{{ bank.bank_name }}</span>
                      </div>
                      <span v-if="bank.isDefault" class="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-emerald-200">
                        Mặc định
                      </span>
                    </div>

                    <div class="pt-2 space-y-1">
                      <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Số tài khoản (Đã che mờ)</p>
                      <p class="font-mono text-base font-black text-slate-900 tracking-wider">
                        {{ bank.account_number_masked }}
                      </p>
                    </div>

                    <div>
                      <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Chủ tài khoản</p>
                      <p class="font-bold text-slate-800 uppercase">{{ bank.account_name }}</p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button v-if="!bank.isDefault" @click="handleSetDefaultBank(bank._id)" class="text-xs font-bold text-slate-500 hover:text-emerald-700">
                      Đặt làm mặc định
                    </button>
                    <span v-else class="text-[11px] text-emerald-600 font-bold">✓ Tài khoản mặc định</span>

                    <div class="flex gap-2">
                      <button @click="openEditBankModal(bank)" class="text-xs font-bold text-blue-600 hover:underline">Sửa</button>
                      <button @click="handleDeleteBank(bank._id)" class="text-xs font-bold text-red-500 hover:underline">Xóa</button>
                    </div>
                  </div>
                </div>

                <div v-if="bankAccounts.length === 0" class="col-span-full text-center py-10 text-slate-400 text-xs font-serif italic border border-dashed rounded-2xl">
                  Chưa có tài khoản ngân hàng nào được liên kết. Vui lòng bấm vào "+ Thêm ngân hàng".
                </div>
              </div>
            </div>

            <!-- TAB 4: ĐIỂM SKINMEDI XU -->
            <div v-if="activeTab === 'points'" class="bg-white border border-[#EBE7DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 class="text-lg font-black text-[#064E3B] flex items-center gap-2">
                    <span class="material-symbols-outlined text-amber-500">stars</span>
                    <span>Điểm Tích Lũy SkinMedi Xu</span>
                  </h3>
                  <p class="text-xs text-slate-500">Tự động tích điểm khi hoàn thành đơn hàng (10.000đ = 1 Xu)</p>
                </div>
              </div>

              <!-- Points Balance Summary Card -->
              <div class="bg-gradient-to-br from-amber-50 via-emerald-50/40 to-white border border-amber-200/60 rounded-3xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div class="space-y-1">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Số Dư Xu Hiện Có</span>
                  <span class="text-3xl font-black text-amber-600 block">⭐ {{ pointsInfo.points }} Xu</span>
                </div>
                <div class="space-y-1 border-t sm:border-t-0 sm:border-l border-amber-200/50 pt-3 sm:pt-0">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Điểm Đã Nhận</span>
                  <span class="text-2xl font-extrabold text-emerald-700 block">+{{ pointsInfo.totalEarned }} Xu</span>
                </div>
                <div class="space-y-1 border-t sm:border-t-0 sm:border-l border-amber-200/50 pt-3 sm:pt-0">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Điểm Đã Dùng</span>
                  <span class="text-2xl font-extrabold text-slate-600 block">-{{ pointsInfo.totalSpent }} Xu</span>
                </div>
              </div>

              <!-- Transaction History -->
              <div class="space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h4 class="font-extrabold text-sm text-[#064E3B]">📋 Lịch sử giao dịch điểm</h4>
                  <div class="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button @click="pointFilter = 'ALL'" class="px-3 py-1 rounded-lg transition-all" :class="pointFilter === 'ALL' ? 'bg-white shadow-xs text-[#064E3B]' : 'text-slate-500'">Tất cả</button>
                    <button @click="pointFilter = 'EARN'" class="px-3 py-1 rounded-lg transition-all" :class="pointFilter === 'EARN' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-500'">+ Tích điểm</button>
                    <button @click="pointFilter = 'SPEND'" class="px-3 py-1 rounded-lg transition-all" :class="pointFilter === 'SPEND' ? 'bg-white shadow-xs text-red-600' : 'text-slate-500'">- Sử dụng</button>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                      <tr>
                        <th class="p-3">Thời gian</th>
                        <th class="p-3">Nội dung</th>
                        <th class="p-3 text-right">Biến động điểm</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr v-for="item in filteredPointHistory" :key="item._id" class="hover:bg-slate-50/60">
                        <td class="p-3 text-slate-500 whitespace-nowrap">{{ formatDate(item.createdAt) }}</td>
                        <td class="p-3 font-semibold text-slate-800">{{ item.description }}</td>
                        <td class="p-3 text-right font-black text-sm" :class="item.amount > 0 ? 'text-emerald-600' : 'text-red-500'">
                          {{ item.amount > 0 ? `+${item.amount}` : item.amount }} Xu
                        </td>
                      </tr>
                      <tr v-if="filteredPointHistory.length === 0">
                        <td colspan="3" class="text-center py-8 text-slate-400 italic">Chưa có giao dịch điểm nào.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- TAB 5: ĐƠN HÀNG CỦA TÔI -->
            <div v-if="activeTab === 'orders'" class="bg-white border border-[#EBE7DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <div class="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 class="text-lg font-black text-[#064E3B] flex items-center gap-2">
                    <span class="material-symbols-outlined">shopping_bag</span>
                    <span>Đơn hàng của tôi</span>
                  </h3>
                  <p class="text-xs text-slate-500">Xem và theo dõi danh sách các đơn hàng đã đặt</p>
                </div>
              </div>

              <div class="space-y-4">
                <div 
                  v-for="order in orders" 
                  :key="order._id" 
                  class="p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all space-y-3 bg-white text-xs"
                >
                  <div class="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
                    <div class="flex items-center gap-2">
                      <span class="font-black text-slate-800 text-sm">#{{ order.order_code || order._id.slice(-8).toUpperCase() }}</span>
                      <span class="text-slate-400">•</span>
                      <span class="text-slate-500">{{ formatDate(order.createdAt || order.order_date) }}</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider" :class="order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
                        {{ order.payment_status === 'paid' ? '✓ Đã thanh toán' : 'Chờ thanh toán' }}
                      </span>

                      <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs" :class="getOrderStatusInfo(order.status).badgeClass">
                        {{ getOrderStatusInfo(order.status).label }}
                      </span>
                    </div>
                  </div>

                  <!-- Return Request Note if exists -->
                  <div v-if="order.status === 'return_requested' || order.return_reason" class="bg-orange-50/80 border border-orange-200 p-2.5 rounded-xl text-[11px] text-orange-900 flex items-start gap-2">
                    <span class="material-symbols-outlined text-orange-600 text-base shrink-0">assignment_return</span>
                    <div>
                      <p><strong>Yêu cầu hoàn hàng:</strong> {{ order.return_reason || 'Đang chờ xét duyệt' }}</p>
                      <p v-if="order.return_note" class="text-orange-700 mt-0.5">Mô tả: {{ order.return_note }}</p>
                    </div>
                  </div>

                  <!-- Order Note Display if exists -->
                  <div v-if="order.note" class="bg-amber-50/60 border border-amber-200/50 p-2.5 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <span class="material-symbols-outlined text-amber-600 text-base shrink-0">edit_note</span>
                    <p><strong>Ghi chú đơn hàng:</strong> {{ order.note }}</p>
                  </div>

                  <div class="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100/80">
                    <span class="text-slate-500">Tổng tiền: <strong class="text-slate-900 text-sm font-black">{{ formatPrice(order.total_amount) }}</strong></span>
                    
                    <div class="flex items-center gap-2">
                      <!-- Cancel Button for pending orders -->
                      <button 
                        v-if="order.status === 'pending' || order.status === 'confirmed'" 
                        @click="handleCancelOrder(order)" 
                        class="btn btn-xs rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold"
                      >
                        ✕ Hủy đơn
                      </button>

                      <!-- Return / Refund Button for delivered/completed orders -->
                      <button 
                        v-if="order.status === 'delivered' || order.status === 'completed'" 
                        @click="openReturnModal(order)" 
                        class="btn btn-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold border-none shadow-xs flex items-center gap-1"
                      >
                        <span class="material-symbols-outlined text-xs">assignment_return</span>
                        <span>Trả hàng / Hoàn tiền</span>
                      </button>

                      <button @click="openOrderDetail(order)" class="btn btn-ghost btn-xs text-[#087443] font-bold underline">
                        Xem chi tiết →
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="orders.length === 0" class="text-center py-10 text-slate-400 text-xs font-serif italic border border-dashed rounded-2xl">
                  Bạn chưa có đơn hàng nào.
                </div>
              </div>
            </div>

            <!-- TAB 6: BẢO MẬT TÀI KHOẢN -->
            <div v-if="activeTab === 'security'" class="bg-white border border-[#EBE7DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <div class="border-b border-slate-100 pb-4">
                <h3 class="text-lg font-black text-[#064E3B] flex items-center gap-2">
                  <span class="material-symbols-outlined">shield</span>
                  <span>Bảo mật tài khoản & Mật khẩu</span>
                </h3>
                <p class="text-xs text-slate-500">Đổi mật khẩu định kỳ để bảo vệ tài khoản cá nhân</p>
              </div>

              <form @submit.prevent="handleChangePassword" class="max-w-md space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">Mật khẩu hiện tại <span class="text-red-500">*</span></label>
                  <input v-model="currentPassword" type="password" class="input input-bordered input-sm w-full rounded-xl" required />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">Mật khẩu mới <span class="text-red-500">*</span></label>
                  <input v-model="newPassword" type="password" class="input input-bordered input-sm w-full rounded-xl" required />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">Xác nhận mật khẩu mới <span class="text-red-500">*</span></label>
                  <input v-model="confirmPassword" type="password" class="input input-bordered input-sm w-full rounded-xl" required />
                </div>

                <button type="submit" :disabled="isChangingPassword" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl px-6 font-bold text-xs">
                  <span v-if="isChangingPassword" class="loading loading-spinner loading-xs mr-1"></span>
                  🔒 Đổi mật khẩu
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </main>

    <!-- ADDRESS MODAL -->
    <div v-if="showAddressModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 text-left relative">
        <button @click="showAddressModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        <h3 class="text-lg font-black text-slate-800 mb-4">📍 {{ isEditingAddr ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ giao hàng' }}</h3>
        
        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Họ tên người nhận</label>
            <input v-model="tempRecipientName" type="text" class="input input-bordered input-sm w-full rounded-xl" />
          </div>

          <div>
            <label class="block font-bold text-slate-600 mb-1">Số điện thoại</label>
            <input v-model="tempPhone" type="text" class="input input-bordered input-sm w-full rounded-xl" />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block font-bold text-slate-600 mb-1">Tỉnh/Thành</label>
              <select v-model="tempProvinceCode" @change="onProvinceChange" class="select select-bordered select-sm w-full rounded-xl">
                <option value="">-- Chọn --</option>
                <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-600 mb-1">Quận/Huyện</label>
              <select v-model="tempDistrictCode" @change="onDistrictChange" class="select select-bordered select-sm w-full rounded-xl">
                <option value="">-- Chọn --</option>
                <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-600 mb-1">Phường/Xã</label>
              <select v-model="tempWardCode" class="select select-bordered select-sm w-full rounded-xl">
                <option value="">-- Chọn --</option>
                <option v-for="w in wards" :key="w.code" :value="w.code">{{ w.name }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-600 mb-1">Địa chỉ chi tiết (Số nhà, tên đường...)</label>
            <input v-model="tempAddressDetail" type="text" class="input input-bordered input-sm w-full rounded-xl" />
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input v-model="tempIsDefault" type="checkbox" id="addrDef" class="checkbox checkbox-xs checkbox-success" />
            <label for="addrDef" class="font-bold text-slate-700 cursor-pointer">Đặt làm địa chỉ giao hàng mặc định</label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <button @click="showAddressModal = false" class="btn btn-ghost btn-sm rounded-xl">Hủy</button>
          <button @click="saveAddress" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl px-6 font-bold">Lưu địa chỉ</button>
        </div>
      </div>
    </div>

    <!-- BANK ACCOUNT MODAL -->
    <div v-if="showBankModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-left relative">
        <button @click="showBankModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        <h3 class="text-lg font-black text-slate-800 mb-4">🏦 {{ isEditingBank ? 'Cập nhật tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng' }}</h3>
        
        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-600 mb-1">Chọn Ngân hàng</label>
            <select v-model="tempBankName" class="select select-bordered select-sm w-full rounded-xl">
              <option v-for="b in popularBanks" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-600 mb-1">Tên chủ tài khoản (Viết hoa không dấu)</label>
            <input v-model="tempAccountName" type="text" placeholder="NGUYEN VAN A" class="input input-bordered input-sm w-full rounded-xl uppercase font-bold" />
          </div>

          <div>
            <label class="block font-bold text-slate-600 mb-1">Số tài khoản ngân hàng</label>
            <input v-model="tempAccountNumber" type="text" placeholder="0382888666" class="input input-bordered input-sm w-full rounded-xl font-mono" />
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input v-model="tempBankIsDefault" type="checkbox" id="bankDef" class="checkbox checkbox-xs checkbox-success" />
            <label for="bankDef" class="font-bold text-slate-700 cursor-pointer">Đặt làm ngân hàng nhận hoàn tiền mặc định</label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <button @click="showBankModal = false" class="btn btn-ghost btn-sm rounded-xl">Hủy</button>
          <button @click="saveBankAccount" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl px-6 font-bold">Lưu ngân hàng</button>
        </div>
      </div>
    </div>

    <!-- ORDER DETAIL MODAL -->
    <div v-if="showOrderDetailModal && selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl border border-slate-100 text-left relative max-h-[90vh] flex flex-col">
        <!-- Modal Header -->
        <div class="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h3 class="text-lg font-black text-slate-800">🛍 Chi tiết đơn hàng #{{ selectedOrder.order_code || selectedOrder._id.slice(-8).toUpperCase() }}</h3>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs" :class="getOrderStatusInfo(selectedOrder.status).badgeClass">
                {{ getOrderStatusInfo(selectedOrder.status).label }}
              </span>
            </div>
            <p class="text-xs text-slate-400">Ngày đặt: {{ formatDate(selectedOrder.createdAt || selectedOrder.order_date) }}</p>
          </div>
          <button @click="showOrderDetailModal = false" class="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">✕</button>
        </div>

        <!-- Modal Body Scrollable -->
        <div class="space-y-4 text-xs overflow-y-auto py-3 flex-grow pr-1">
          <!-- Product List -->
          <div>
            <h4 class="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-emerald-600">shopping_bag</span>
              <span>Danh sách sản phẩm ({{ (selectedOrder.items && selectedOrder.items.length) || 1 }} món)</span>
            </h4>
            <div class="space-y-2">
              <div v-for="(item, idx) in (selectedOrder.items || [selectedOrder])" :key="item._id || idx" class="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <img :src="item.product_id?.image || selectedOrder.product_id?.image || 'https://placehold.co/80x80?text=SP'" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white" alt="Ảnh sản phẩm" />
                  <div class="min-w-0">
                    <p class="font-bold text-slate-800 truncate text-xs">{{ item.product_id?.title || selectedOrder.product_id?.title || 'Sản phẩm' }}</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">Số lượng: <strong class="text-slate-700">{{ item.quantity || selectedOrder.quantity || 1 }}</strong></p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-extrabold text-emerald-700 text-xs">{{ formatPrice((item.price_at_purchase || selectedOrder.price_at_purchase || item.price || 0) * (item.quantity || selectedOrder.quantity || 1)) }}</p>
                  <p v-if="(item.quantity || selectedOrder.quantity || 1) > 1" class="text-[10px] text-slate-400">{{ formatPrice(item.price_at_purchase || selectedOrder.price_at_purchase || item.price || 0) }}/món</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Info -->
          <div class="bg-slate-50 p-3.5 rounded-2xl space-y-1.5 border border-slate-100">
            <p class="font-bold text-slate-700 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-emerald-600">local_shipping</span>
              <span>Thông tin nhận hàng</span>
            </p>
            <p class="text-slate-600">Người nhận: <strong class="text-slate-800">{{ selectedOrder.user_id?.first_name ? `${selectedOrder.user_id.first_name} ${selectedOrder.user_id.last_name || ''}` : (selectedOrder.phone_number || 'Khách hàng') }}</strong> (SĐT: {{ selectedOrder.phone_number }})</p>
            <p class="text-slate-600">Địa chỉ nhận: {{ formatAddress(selectedOrder.shipping_address) }}</p>
          </div>

          <!-- Tracking History if available -->
          <div v-if="selectedOrder.tracking_history && selectedOrder.tracking_history.length > 0" class="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 space-y-2">
            <p class="font-bold text-blue-900 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-blue-600">timeline</span>
              <span>Hành trình đơn hàng {{ selectedOrder.tracking_number ? `(${selectedOrder.tracking_number})` : '' }}</span>
            </p>
            <div class="space-y-2 pl-2 border-l-2 border-blue-200">
              <div v-for="(track, tIdx) in [...selectedOrder.tracking_history].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))" :key="tIdx" class="relative pl-3">
                <div class="absolute -left-[11px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white"></div>
                <p class="font-bold text-blue-900 text-[11px]">{{ track.description || track.status }}</p>
                <p class="text-[10px] text-blue-600/80">{{ formatDate(track.timestamp) }} <span v-if="track.location">• {{ track.location }}</span></p>
              </div>
            </div>
          </div>

          <!-- Order Note -->
          <div v-if="selectedOrder.note" class="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/60 text-amber-900">
            <p class="font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">edit_note</span>
              <span>Ghi chú đơn hàng:</span>
            </p>
            <p class="mt-0.5">{{ selectedOrder.note }}</p>
          </div>

          <!-- Payment & Shipping Details -->
          <div class="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div class="flex justify-between items-center text-slate-700">
              <span>Phương thức thanh toán:</span>
              <strong class="text-emerald-700">{{ selectedOrder.payment_method }} ({{ selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán' }})</strong>
            </div>
            <div class="flex justify-between items-center text-slate-700">
              <span>Phương thức vận chuyển:</span>
              <strong class="text-slate-800 uppercase">{{ selectedOrder.shipping_method }}</strong>
            </div>
            <div class="flex justify-between items-center text-slate-700">
              <span>Phí vận chuyển:</span>
              <span>{{ formatPrice(selectedOrder.shipping_fee) }}</span>
            </div>
            <div class="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center font-black text-sm">
              <span class="text-slate-800">Tổng thanh toán:</span>
              <span class="text-emerald-700 text-base">{{ formatPrice(selectedOrder.total_amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-100 shrink-0">
          <div class="flex items-center gap-2">
            <button 
              v-if="selectedOrder.status === 'delivered' || selectedOrder.status === 'completed'" 
              @click="openReturnModal(selectedOrder); showOrderDetailModal = false;" 
              class="btn btn-sm rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold border-none text-xs flex items-center gap-1 shadow-xs"
            >
              <span class="material-symbols-outlined text-sm">assignment_return</span>
              <span>Yêu cầu Trả hàng / Hoàn tiền</span>
            </button>
            <button 
              v-if="selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed'" 
              @click="handleCancelOrder(selectedOrder); showOrderDetailModal = false;" 
              class="btn btn-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs"
            >
              ✕ Hủy đơn hàng
            </button>
          </div>

          <button @click="showOrderDetailModal = false" class="btn btn-ghost btn-sm rounded-xl font-bold text-slate-600 hover:bg-slate-100">Đóng</button>
        </div>
      </div>
    </div>

    <!-- RETURN / REFUND REQUEST MODAL -->
    <div v-if="showReturnModal && orderToReturn" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 text-left relative">
        <button @click="showReturnModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-2xl text-amber-500">assignment_return</span>
          <h3 class="text-lg font-black text-slate-800">Yêu cầu Trả hàng / Hoàn tiền</h3>
        </div>

        <div class="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl mb-4 text-xs text-amber-900 leading-relaxed">
          <p><strong>Đơn hàng:</strong> #{{ orderToReturn.order_code || orderToReturn._id.slice(-8).toUpperCase() }} — Tổng tiền: <strong>{{ formatPrice(orderToReturn.total_amount) }}</strong></p>
          <p class="text-[11px] text-amber-700 mt-1">Chính sách: Khách hàng được đổi trả trong 7 ngày nếu sản phẩm lỗi, giao sai hoặc gặp kích ứng y tế.</p>
        </div>

        <form @submit.prevent="submitReturnRequest" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Lý do yêu cầu trả hàng <span class="text-red-500">*</span></label>
            <select v-model="returnReason" class="select select-bordered select-sm w-full rounded-xl" required>
              <option v-for="r in returnReasonOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Mô tả chi tiết tình trạng sản phẩm</label>
            <textarea 
              v-model="returnNote" 
              rows="3" 
              placeholder="Vui lòng mô tả chi tiết lý do (Ví dụ: Sản phẩm bị nứt nắp, serum đổi màu, da bị châm chích mẩn đỏ sau khi dùng...)"
              class="textarea textarea-bordered textarea-sm w-full rounded-xl"
            ></textarea>
          </div>

          <!-- Bank Account for refund notice -->
          <div class="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl space-y-1">
            <p class="font-bold text-slate-700 flex items-center gap-1">
              <span>🏦 Tài khoản nhận tiền hoàn:</span>
            </p>
            <p v-if="defaultBank" class="text-emerald-700 font-bold">
              {{ defaultBank.bank_name }} - {{ defaultBank.account_number_masked }} ({{ defaultBank.account_name }})
            </p>
            <p v-else class="text-slate-500 italic">
              Tiền hoàn sẽ được chuyển qua STK ngân hàng hoặc cộng vào SkinMedi Xu sau khi kiểm duyệt.
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" @click="showReturnModal = false" class="btn btn-ghost btn-sm rounded-xl">Hủy bỏ</button>
            <button 
              type="submit" 
              :disabled="isSubmittingReturn" 
              class="btn bg-amber-500 hover:bg-amber-600 text-white btn-sm rounded-xl px-6 font-bold"
            >
              <span v-if="isSubmittingReturn" class="loading loading-spinner loading-xs mr-1"></span>
              Xác nhận gửi yêu cầu
            </button>
          </div>
        </form>
      </div>
    </div>

    <Footer />
  </div>
</template>