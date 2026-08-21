<script setup>
import AdminLayout from '../components/AdminLayout.vue';
import { ref, onMounted, computed } from 'vue';
import ApiClient from '../services/api.service';
import { push } from 'notivue';

const api = ApiClient();
const customers = ref([]);
const logs = ref([]);
const loading = ref(true);
const searchText = ref('');

// Modal Adjustment state
const showAdjustModal = ref(false);
const selectedCustomer = ref(null);
const adjustAmount = ref(10);
const adjustType = ref('ADD'); // 'ADD' or 'SUBTRACT'
const adjustReason = ref('Thưởng điểm tri ân khách hàng');
const isSubmitting = ref(false);

// Game Settings
const gameLimitHours = ref(24);
const gameLimitTries = ref(1);
const gameActive = ref(true);
const isSavingConfig = ref(false);

// Stats variables
const statsTotalTosses = ref(0);
const statsTotalWins = ref(0);
const statsTotalVouchersCreated = ref(0);

const fetchData = async () => {
  loading.value = true;
  try {
    const resUsers = await api.get('/api/user');
    const allUsers = resUsers.data || [];
    // Filter customers
    customers.value = allUsers.filter(u => u.role === 'CUSTOMER' || u.role === 'user');

    // Load recent point logs
    try {
      const resLogs = await api.get('/api/user/points/history');
      logs.value = resLogs.data || [];

      // Calculate statistics
      const tossLogs = logs.value.filter(log => log.description.includes("tung xu"));
      statsTotalTosses.value = tossLogs.length;
      statsTotalWins.value = tossLogs.filter(log => log.description.includes("Thắng")).length;
      statsTotalVouchersCreated.value = statsTotalWins.value;
    } catch (e) {
      console.error(e);
    }

    // Load game config settings
    try {
      const resConfig = await api.get('/api/setting/coin_toss_game_config');
      if (resConfig.data && resConfig.data.gia_tri) {
        gameLimitHours.value = resConfig.data.gia_tri.limit_hours || 24;
        gameLimitTries.value = resConfig.data.gia_tri.limit_tries || 1;
        gameActive.value = resConfig.data.gia_tri.active !== false;
      }
    } catch (configErr) {
      console.log("No custom coin toss game config found.");
    }
  } finally {
    loading.value = false;
  }
};

const saveGameConfig = async () => {
  try {
    isSavingConfig.value = true;
    
    // Check if configuration already exists
    let settingId = null;
    try {
      const resConfig = await api.get('/api/setting/coin_toss_game_config');
      if (resConfig.data) {
        settingId = resConfig.data.id || resConfig.data._id;
      }
    } catch (e) {
      // Not found is fine
    }

    const payload = {
      khoa_cau_hinh: "coin_toss_game_config",
      gia_tri: {
        limit_hours: gameLimitHours.value,
        limit_tries: gameLimitTries.value,
        active: gameActive.value
      },
      mo_ta: "Cấu hình giới hạn lượt chơi game Tung Xu của Khách Hàng"
    };

    if (settingId) {
      await api.put(`/api/setting/${settingId}`, {
        gia_tri: payload.gia_tri,
        mo_ta: payload.mo_ta
      });
    } else {
      await api.post('/api/setting', payload);
    }
    push.success("Cập nhật cấu hình game thành công!");
  } catch (err) {
    console.error(err);
    push.error("Lỗi khi lưu cấu hình game");
  } finally {
    isSavingConfig.value = false;
  }
};

const filteredCustomers = computed(() => {
  if (!searchText.value.trim()) return customers.value;
  const kw = searchText.value.toLowerCase();
  return customers.value.filter(c => 
    (c.first_name + ' ' + c.last_name).toLowerCase().includes(kw) ||
    (c.email || '').toLowerCase().includes(kw) ||
    (c.phone || '').includes(kw) ||
    (c.username || '').toLowerCase().includes(kw)
  );
});

const openAdjustModal = (customer) => {
  selectedCustomer.value = customer;
  adjustAmount.value = 10;
  adjustType.value = 'ADD';
  adjustReason.value = 'Thưởng điểm tri ân khách hàng';
  showAdjustModal.value = true;
};

const handleAdjustPoints = async () => {
  if (!adjustReason.value.trim()) {
    push.warning("Bắt buộc phải nhập Lý do điều chỉnh điểm!");
    return;
  }
  const pointChange = adjustType.value === 'ADD' ? Math.abs(adjustAmount.value) : -Math.abs(adjustAmount.value);

  try {
    isSubmitting.value = true;
    const res = await api.post('/api/user/points/adjust', {
      user_id: selectedCustomer.value._id,
      type: 'ADJUST',
      amount: pointChange,
      reason: adjustReason.value.trim()
    });

    push.success(res.data?.message || "Điều chỉnh điểm thành công!");
    showAdjustModal.value = false;
    fetchData();
  } catch (err) {
    console.error(err);
    push.error(err.response?.data?.message || "Lỗi khi điều chỉnh điểm khách hàng");
  } finally {
    isSubmitting.value = false;
  }
};

// Toss Coin Voucher state
const showTossModal = ref(false);
const selectedTossCustomer = ref(null);
const tossStatus = ref('idle'); // 'idle' | 'tossing' | 'won' | 'lost'
const tossResult = ref(''); // 'HEADS' | 'TAILS'
const winPromoCode = ref('');

const openTossModal = (customer) => {
  selectedTossCustomer.value = customer;
  tossStatus.value = 'idle';
  tossResult.value = '';
  winPromoCode.value = '';
  showTossModal.value = true;
};

const rollTossVoucher = async () => {
  if (tossStatus.value === 'tossing') return;
  tossStatus.value = 'tossing';
  
  // Coin flipping delay animation simulation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const coinSide = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
  tossResult.value = coinSide;
  
  if (coinSide === 'HEADS') {
    tossStatus.value = 'won';
    try {
      // Award points + create a dynamic Voucher on the backend
      const randomCode = 'LUCKYCOIN' + Math.floor(1000 + Math.random() * 9000);
      winPromoCode.value = randomCode;

      // Add promotion
      await api.post('/api/promotion', {
        ma_khuyen_mai: randomCode,
        ten: `Quà tặng Tung Xu - ${selectedTossCustomer.value.first_name}`,
        loai_giam_gia: 'fixed',
        gia_tri_giam: 50000, // 50k voucher
        ngay_bat_dau: new Date().toISOString(),
        ngay_ket_thuc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
        gia_tri_don_toi_thieu: 150000,
        so_tien_giam_toi_da: 50000,
        gioi_han_su_dung: 1,
        trang_thai: 'active'
      });

      // Bonus points to customer for winning toss
      await api.post('/api/user/points/adjust', {
        user_id: selectedTossCustomer.value._id,
        type: 'ADJUST',
        amount: 20,
        reason: `Thắng game tung xu: Nhận 20 Xu & Voucher 50k (${randomCode})`
      });

      push.success(`Chúc mừng! Nhận được mặt sấp HEADS. Nhận Voucher ${randomCode} & +20 Xu`);
      fetchData();
    } catch (e) {
      console.error(e);
      push.error('Không thể tạo voucher khuyến mãi tự động');
    }
  } else {
    tossStatus.value = 'lost';
    push.info('Mặt ngửa TAILS - Chúc may mắn lần sau');
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('vi-VN');
};

onMounted(fetchData);
</script>

<template>
  <AdminLayout>
    <div class="space-y-6 text-left">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 class="text-2xl font-black text-[#064E3B] flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-500">stars</span>
            <span>Quản Lý Điểm Tích Lũy Khách Hàng (SkinMedi Xu)</span>
          </h1>
          <p class="text-xs text-slate-500">Cộng/trừ điểm thủ công và theo dõi nhật ký điều chỉnh điểm</p>
        </div>

        <div class="w-full sm:w-72">
          <input 
            v-model="searchText" 
            type="text" 
            placeholder="Tìm theo tên, email, SĐT..." 
            class="input input-bordered input-sm w-full rounded-xl text-xs" 
          />
        </div>
      </div>

      <!-- GAME CONFIGURATION & STATS SUMMARY PANEL -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-xs">
        <!-- Col 1: Config limit tries -->
        <div class="space-y-3">
          <h3 class="font-extrabold text-slate-800 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-emerald-600 text-sm">settings_suggest</span>
            <span>Cài đặt game Tung Xu</span>
          </h3>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <label class="font-semibold text-slate-500 w-32">Trạng thái game:</label>
              <input type="checkbox" v-model="gameActive" class="toggle toggle-primary toggle-sm" />
            </div>
            <div class="flex items-center gap-3">
              <label class="font-semibold text-slate-500 w-32">Hạn tung (giờ):</label>
              <input type="number" v-model.number="gameLimitHours" class="input input-bordered input-xs w-20 rounded-lg text-center" />
            </div>
            <div class="flex items-center gap-3">
              <label class="font-semibold text-slate-500 w-32">Lượt/đơn hàng:</label>
              <input type="number" v-model.number="gameLimitTries" class="input input-bordered input-xs w-20 rounded-lg text-center font-bold" disabled />
            </div>
            <button @click="saveGameConfig" :disabled="isSavingConfig" class="btn btn-xs bg-[#087443] hover:bg-[#064E3B] text-white rounded-lg w-full font-bold">
              Lưu cấu hình game
            </button>
          </div>
        </div>

        <!-- Col 2: Game Stats -->
        <div class="space-y-2 border-l border-slate-100 pl-6">
          <h3 class="font-extrabold text-slate-800 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-amber-500 text-sm">monitoring</span>
            <span>Thống kê lượt chơi</span>
          </h3>
          <ul class="space-y-2 text-slate-600">
            <li class="flex justify-between"><span>Tổng số lượt đã chơi:</span><strong class="text-slate-800">{{ statsTotalTosses }}</strong></li>
            <li class="flex justify-between"><span>Số lượt Thắng (HEADS):</span><strong class="text-emerald-600 font-bold">{{ statsTotalWins }}</strong></li>
            <li class="flex justify-between"><span>Số lượt Thua (TAILS):</span><strong class="text-red-500">{{ statsTotalTosses - statsTotalWins }}</strong></li>
            <li class="flex justify-between"><span>Tỷ lệ thắng trung bình:</span><strong class="text-[#087443]">{{ statsTotalTosses ? Math.round((statsTotalWins / statsTotalTosses) * 100) : 0 }}%</strong></li>
          </ul>
        </div>

        <!-- Col 3: Reward Stats -->
        <div class="space-y-2 border-l border-slate-100 pl-6">
          <h3 class="font-extrabold text-slate-800 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-purple-600 text-sm">redeem</span>
            <span>Voucher đã cấp</span>
          </h3>
          <ul class="space-y-2 text-slate-600">
            <li class="flex justify-between"><span>Mệnh giá Voucher:</span><strong class="text-slate-800">50.000đ</strong></li>
            <li class="flex justify-between"><span>Voucher đã phát hành:</span><strong class="text-purple-600 font-bold">{{ statsTotalVouchersCreated }}</strong></li>
            <li class="flex justify-between"><span>Tổng giá trị phát hành:</span><strong class="text-emerald-600 font-black">{{ new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(statsTotalVouchersCreated * 50000) }}</strong></li>
          </ul>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <span class="loading loading-spinner text-[#087443] loading-lg"></span>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Customer Points Table -->
        <div class="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 class="font-extrabold text-slate-800 text-sm">Danh sách khách hàng ({{ filteredCustomers.length }})</h3>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th class="p-3.5">Khách hàng</th>
                  <th class="p-3.5">Liên hệ</th>
                  <th class="p-3.5 text-center">Số dư Xu</th>
                  <th class="p-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="c in filteredCustomers" :key="c._id" class="hover:bg-slate-50/60">
                  <td class="p-3.5 font-bold text-slate-800">
                    <div>{{ c.first_name }} {{ c.last_name }}</div>
                    <div class="text-[10px] text-slate-400 font-normal">@{{ c.username }}</div>
                  </td>
                  <td class="p-3.5 text-slate-600">
                    <div>{{ c.email || 'N/A' }}</div>
                    <div class="text-[11px] text-slate-400 font-mono">{{ c.phone || 'Chưa có SĐT' }}</div>
                  </td>
                  <td class="p-3.5 text-center">
                    <span class="px-3 py-1 bg-amber-100 text-amber-900 font-black rounded-full text-xs border border-amber-300">
                      ⭐ {{ c.points || 0 }} Xu
                    </span>
                  </td>
                  <td class="p-3.5 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <button @click="openAdjustModal(c)" class="btn btn-xs bg-[#087443] hover:bg-[#064E3B] text-white rounded-lg font-bold">
                        ± Điều chỉnh Xu
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredCustomers.length === 0">
                  <td colspan="4" class="text-center py-8 text-slate-400 italic">Không tìm thấy khách hàng phù hợp.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Logs Panel -->
        <div class="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 class="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">
            📋 Nhật ký điều chỉnh gần đây
          </h3>

          <div class="space-y-3 max-h-[500px] overflow-y-auto text-xs">
            <div v-for="log in logs" :key="log._id" class="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div class="flex justify-between items-center">
                <span class="font-bold text-slate-800">{{ log.description }}</span>
                <span class="font-black text-xs" :class="log.amount > 0 ? 'text-emerald-600' : 'text-red-500'">
                  {{ log.amount > 0 ? `+${log.amount}` : log.amount }} Xu
                </span>
              </div>
              <p v-if="log.reason" class="text-[11px] text-slate-600 italic">Lý do: "{{ log.reason }}"</p>
              <p class="text-[10px] text-slate-400">{{ formatDate(log.createdAt) }}</p>
            </div>

            <div v-if="logs.length === 0" class="text-center py-6 text-slate-400 italic">Chưa có lịch sử điều chỉnh điểm nào.</div>
          </div>
        </div>

      </div>

      <!-- ADJUSTMENT MODAL -->
      <div v-if="showAdjustModal && selectedCustomer" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-left relative">
          <button @click="showAdjustModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          
          <h3 class="text-lg font-black text-slate-800 mb-1">⭐ Điều chỉnh điểm SkinMedi Xu</h3>
          <p class="text-xs text-slate-500 mb-4">Khách hàng: <strong>{{ selectedCustomer.first_name }} {{ selectedCustomer.last_name }}</strong> (Số dư hiện tại: {{ selectedCustomer.points || 0 }} Xu)</p>

          <form @submit.prevent="handleAdjustPoints" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-600 mb-1">Loại điều chỉnh <span class="text-red-500">*</span></label>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  @click="adjustType = 'ADD'" 
                  class="py-2.5 rounded-xl font-bold border transition-all text-xs"
                  :class="adjustType === 'ADD' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'"
                >
                  + Cộng thêm điểm
                </button>
                <button 
                  type="button" 
                  @click="adjustType = 'SUBTRACT'" 
                  class="py-2.5 rounded-xl font-bold border transition-all text-xs"
                  :class="adjustType === 'SUBTRACT' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-700 border-slate-200'"
                >
                  - Trừ bớt điểm
                </button>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-600 mb-1">Số điểm Xu <span class="text-red-500">*</span></label>
              <input v-model.number="adjustAmount" type="number" min="1" class="input input-bordered input-sm w-full rounded-xl font-bold" required />
            </div>

            <div>
              <label class="block font-bold text-slate-600 mb-1">BẮT BUỘC: Lý do điều chỉnh <span class="text-red-500">*</span></label>
              <textarea v-model="adjustReason" rows="3" placeholder="Ví dụ: Đền bù đơn hàng bị trễ, Quà tặng sinh nhật..." class="textarea textarea-bordered w-full rounded-xl text-xs" required></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showAdjustModal = false" class="btn btn-ghost btn-sm rounded-xl">Hủy</button>
              <button type="submit" :disabled="isSubmitting" class="btn bg-[#087443] hover:bg-[#064E3B] text-white btn-sm rounded-xl px-6 font-bold">
                <span v-if="isSubmitting" class="loading loading-spinner loading-xs mr-1"></span>
                Xác nhận điều chỉnh
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- TOSS COIN VOUCHER MODAL -->
      <div v-if="showTossModal && selectedTossCustomer" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-left relative text-xs">
          <button @click="showTossModal = false" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          
          <h3 class="text-lg font-black text-slate-800 mb-1">🪙 Mini Game: Tung Xu Nhận Voucher</h3>
          <p class="text-slate-500 mb-4">Cơ hội tặng Voucher 50k & 20 Xu tích lũy cho <strong>{{ selectedTossCustomer.first_name }} {{ selectedTossCustomer.last_name }}</strong>.</p>
          
          <div class="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <!-- Coin Animation Placeholder -->
            <div class="relative w-20 h-20 rounded-full bg-amber-400 border-4 border-amber-500 flex items-center justify-center shadow-lg font-black text-amber-900 text-lg select-none"
                 :class="{ 'animate-bounce': tossStatus === 'tossing' }">
              <span v-if="tossStatus === 'idle'">🪙</span>
              <span v-else-if="tossStatus === 'tossing'">🌀</span>
              <span v-else-if="tossResult === 'HEADS'">HEADS</span>
              <span v-else>TAILS</span>
            </div>
            
            <p class="font-bold text-center text-slate-700">
              <span v-if="tossStatus === 'idle'">Tung xu để quyết định vận may!</span>
              <span v-else-if="tossStatus === 'tossing'">Đang xoay đồng xu...</span>
              <span v-else-if="tossStatus === 'won'" class="text-emerald-600">Thắng! Nhận được mặt Sấp (HEADS) 🌟</span>
              <span v-else-if="tossStatus === 'lost'" class="text-red-500">Mặt ngửa (TAILS) - Chúc may mắn lần sau!</span>
            </p>
            
            <div v-if="tossStatus === 'won'" class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center w-5/6">
              <p class="font-bold text-emerald-800">🎉 Đã kích hoạt Voucher 50k!</p>
              <p class="font-mono text-sm bg-white border border-emerald-300 py-1.5 px-3 rounded-lg mt-1 select-all font-black text-slate-800 text-center tracking-widest">{{ winPromoCode }}</p>
              <p class="text-[10px] text-emerald-600 mt-1">Đã tự động cộng +20 Xu vào tài khoản khách hàng.</p>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 pt-4">
            <button type="button" @click="showTossModal = false" class="btn btn-ghost btn-sm rounded-xl">Đóng</button>
            <button 
              type="button" 
              @click="rollTossVoucher" 
              :disabled="tossStatus === 'tossing'" 
              class="btn bg-amber-500 hover:bg-amber-600 text-amber-950 btn-sm rounded-xl px-6 font-bold flex items-center gap-1"
            >
              <span v-if="tossStatus === 'tossing'" class="loading loading-spinner loading-xs mr-1"></span>
              {{ tossStatus === 'idle' ? '🪙 Bắt đầu tung' : tossStatus === 'tossing' ? 'Đang quay...' : '🔄 Tung lại' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
