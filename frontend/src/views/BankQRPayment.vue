<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { push } from 'notivue';
import PaymentService from '../services/payment.service';

const route = useRoute();
const router = useRouter();
const paymentService = new PaymentService();

// ── BANK INFO (configure here) ────────────────────────────────
const BANK_ID      = 'MB';          // Bank code for VietQR
const ACCOUNT_NO   = '0382888666';  // Account number
const ACCOUNT_NAME = 'SKIN MEDI AI';
const BANK_NAME    = 'MB Bank (Ngân hàng Quân Đội)';

// ── STATE ─────────────────────────────────────────────────────
const orderId      = ref('');
const orderCode    = ref('');
const amount       = ref(0);
const paymentStatus = ref('unpaid'); // unpaid | verifying | paid | expired
const loading      = ref(true);
const submitting   = ref(false);
const loadError    = ref(false);

// Countdown timer (15 min)
const TOTAL_SECONDS = 15 * 60;
const secondsLeft   = ref(TOTAL_SECONDS);
let countdownTimer  = null;
let pollTimer       = null;

// ── COMPUTED ──────────────────────────────────────────────────
const transferContent = computed(() =>
  orderCode.value ? `SKINMEDI ${orderCode.value}` : `SKINMEDI ${orderId.value?.slice(-8).toUpperCase()}`
);

const qrUrl = computed(() => {
  if (!orderId.value) return '';
  const amt = Math.round(amount.value);
  const info = encodeURIComponent(transferContent.value);
  const name = encodeURIComponent(ACCOUNT_NAME);
  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amt}&addInfo=${info}&accountName=${name}`;
});

const formattedAmount = computed(() =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount.value)
);

const timerDisplay = computed(() => {
  const m = Math.floor(secondsLeft.value / 60).toString().padStart(2, '0');
  const s = (secondsLeft.value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

const timerUrgent = computed(() => secondsLeft.value < 120);

const statusConfig = computed(() => {
  switch (paymentStatus.value) {
    case 'verifying':
      return {
        color: 'amber',
        icon: '🔍',
        title: 'Đang kiểm tra giao dịch',
        desc: 'Hệ thống đã nhận yêu cầu của bạn và đang kiểm tra giao dịch. Vui lòng chờ xác nhận từ admin.',
      };
    case 'paid':
      return {
        color: 'emerald',
        icon: '✅',
        title: 'Thanh toán thành công!',
        desc: `Đơn hàng ${orderCode.value} đã nhận được thanh toán và đang được chuẩn bị.`,
      };
    case 'expired':
      return {
        color: 'red',
        icon: '⏰',
        title: 'Hết thời gian thanh toán',
        desc: 'Phiên thanh toán đã hết hạn. Bạn có thể quay lại đơn hàng để thanh toán lại.',
      };
    default:
      return null;
  }
});

// ── METHODS ───────────────────────────────────────────────────
const copyText = (text, label) => {
  if (!text) return;
  navigator.clipboard.writeText(text);
  push.success(`Đã sao chép ${label}!`);
};

const loadPaymentStatus = async () => {
  if (!orderId.value) return;
  try {
    const data = await paymentService.getPaymentStatus(orderId.value);
    paymentStatus.value = data.payment_status || 'unpaid';
    amount.value = data.amount || amount.value;
    orderCode.value = data.order_code || orderCode.value;

    if (paymentStatus.value === 'paid') {
      stopTimers();
    }
  } catch (e) {
    console.error('Poll error:', e);
  }
};

const startPolling = () => {
  pollTimer = setInterval(loadPaymentStatus, 10000); // poll every 10s
};

const startCountdown = () => {
  countdownTimer = setInterval(() => {
    secondsLeft.value -= 1;
    if (secondsLeft.value <= 0) {
      paymentStatus.value = 'expired';
      stopTimers();
    }
  }, 1000);
};

const stopTimers = () => {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  if (pollTimer)      { clearInterval(pollTimer);      pollTimer = null; }
};

const handleIHavePaid = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const res = await paymentService.bankTransferRequest(orderId.value);
    paymentStatus.value = res.payment_status || 'verifying';
    push.success('Đã ghi nhận! Hệ thống đang kiểm tra giao dịch của bạn.');
  } catch (e) {
    const msg = e.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
    push.error(msg);
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  stopTimers();
  router.push({ name: 'order.check' });
};

const handleGoToOrders = () => {
  stopTimers();
  router.push({ name: 'order.check' });
};

// ── LIFECYCLE ─────────────────────────────────────────────────
onMounted(async () => {
  orderId.value   = route.query.order_id || route.params.id || '';
  orderCode.value = route.query.order_code || '';
  amount.value    = Number(route.query.amount || 0);

  if (!orderId.value) {
    push.error('Không tìm thấy thông tin đơn hàng.');
    router.push('/');
    return;
  }

  try {
    await loadPaymentStatus();
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }

  if (paymentStatus.value !== 'paid') {
    startCountdown();
    startPolling();
  }
});

onUnmounted(() => stopTimers());
</script>

<template>
  <div class="min-h-screen bg-[#F4FAF7] font-sans flex flex-col">

    <!-- ── TOP BAR ── -->
    <header class="bg-white border-b border-[#E5ECE8] px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-[#087F5B] rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div>
          <p class="text-base font-extrabold text-[#123F35] leading-none">SKIN MEDI <span class="font-light italic text-[#008A63]">AI</span></p>
          <p class="text-[9px] uppercase tracking-[0.2em] text-[#66756F]">Dermatology & Botanical</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-[#087F5B] font-semibold bg-[#EBF4EF] border border-[#C9DDD6] rounded-full px-3 py-1.5">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
        Thanh toán an toàn
      </div>
    </header>

    <!-- ── LOADING ── -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="w-12 h-12 border-4 border-[#087F5B] border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm text-[#66756F] font-medium">Đang tải thông tin thanh toán...</p>
    </div>

    <!-- ── STATUS: PAID / VERIFYING / EXPIRED ── -->
    <div v-else-if="statusConfig && paymentStatus !== 'verifying'" class="flex-1 flex items-center justify-center p-6">
      <div class="w-full max-w-md bg-white rounded-3xl border border-[#E5ECE8] shadow-sm p-10 text-center space-y-5">
        <div class="text-6xl">{{ statusConfig.icon }}</div>
        <div>
          <h2 class="text-xl font-extrabold text-[#123F35]">{{ statusConfig.title }}</h2>
          <p class="text-sm text-[#66756F] mt-2 leading-relaxed">{{ statusConfig.desc }}</p>
        </div>
        <div v-if="paymentStatus === 'paid'" class="bg-[#EBF4EF] border border-[#C9DDD6] rounded-2xl p-4 text-sm text-[#315F53] text-left space-y-1.5">
          <p><span class="font-bold text-[#123F35]">Mã đơn hàng:</span> {{ orderCode }}</p>
          <p><span class="font-bold text-[#123F35]">Số tiền:</span> {{ formattedAmount }}</p>
          <p><span class="font-bold text-[#123F35]">Trạng thái:</span> <span class="text-emerald-600 font-semibold">Đã thanh toán ✓</span></p>
        </div>
        <button @click="handleGoToOrders"
          class="w-full bg-[#087F5B] hover:bg-[#006B4A] text-white font-extrabold py-3.5 rounded-2xl transition text-sm shadow-md">
          Xem đơn hàng của tôi →
        </button>
        <button @click="router.push('/')" class="text-xs text-[#66756F] hover:text-[#087F5B] transition underline underline-offset-2">
          Về trang chủ
        </button>
      </div>
    </div>

    <!-- ── MAIN QR PAYMENT LAYOUT ── -->
    <main v-else class="flex-1 flex items-start justify-center p-4 md:p-8">
      <div class="w-full max-w-4xl">

        <!-- Title -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-extrabold text-[#123F35]">Thanh Toán Đơn Hàng</h1>
          <p class="text-sm text-[#66756F] mt-1">
            Đơn hàng: <span class="font-bold text-[#123F35]">{{ orderCode || orderId }}</span>
          </p>
        </div>

        <!-- Timer -->
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="flex items-center gap-2 px-4 py-2 rounded-full border"
            :class="timerUrgent ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[#EBF4EF] border-[#C9DDD6] text-[#087F5B]'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 6v6l4 2"/>
            </svg>
            <span class="text-sm font-bold font-mono">{{ timerDisplay }}</span>
            <span class="text-xs font-medium">còn lại</span>
          </div>
          <!-- Verifying badge -->
          <div v-if="paymentStatus === 'verifying'"
            class="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-xs font-semibold animate-pulse">
            <svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Đang kiểm tra giao dịch...
          </div>
        </div>

        <!-- Two-column card -->
        <div class="bg-white rounded-3xl border border-[#E5ECE8] shadow-sm overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-2">

            <!-- ── LEFT: QR CODE ── -->
            <div class="flex flex-col items-center justify-center p-8 border-b lg:border-b-0 lg:border-r border-[#E5ECE8] bg-[#F8FAF8]">
              <p class="text-xs font-bold uppercase tracking-widest text-[#66756F] mb-5">Quét mã QR để thanh toán</p>

              <!-- QR frame -->
              <div class="relative">
                <div class="w-56 h-56 md:w-64 md:h-64 bg-white rounded-2xl p-3 shadow-md border border-[#DCE6E1] flex items-center justify-center">
                  <img v-if="qrUrl" :src="qrUrl" alt="Mã VietQR" class="w-full h-full object-contain rounded-xl" />
                  <div v-else class="text-center text-[#A5BAB2]">
                    <div class="text-5xl mb-2">📷</div>
                    <p class="text-xs">Đang tạo mã QR...</p>
                  </div>
                </div>
                <!-- VietQR badge -->
                <div class="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <span class="bg-white border border-[#C9DDD6] text-[#087F5B] text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <span class="text-base">📲</span> VietQR
                  </span>
                </div>
              </div>

              <p class="text-xs text-[#66756F] mt-8 text-center leading-relaxed max-w-xs">
                Mở App Ngân hàng → Chuyển tiền → Quét QR<br/>
                <span class="text-[#087F5B] font-semibold">MB, Vietcombank, Techcombank, BIDV...</span> đều được hỗ trợ.
              </p>
            </div>

            <!-- ── RIGHT: BANK INFO ── -->
            <div class="p-8 flex flex-col gap-5">
              <div>
                <h2 class="text-sm font-bold text-[#123F35] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span class="w-1 h-5 bg-[#087F5B] rounded-full"></span>
                  Thông tin chuyển khoản
                </h2>

                <!-- Amount highlight -->
                <div class="bg-gradient-to-r from-[#EBF4EF] to-[#F4FAF7] border border-[#C9DDD6] rounded-2xl p-4 mb-4 text-center">
                  <p class="text-xs text-[#66756F] font-medium mb-1">Số tiền cần chuyển</p>
                  <p class="text-3xl font-black text-[#087F5B]">{{ formattedAmount }}</p>
                  <p class="text-xs text-red-500 font-semibold mt-1">⚠️ Chuyển đúng số tiền này</p>
                </div>

                <!-- Bank details -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between py-2.5 border-b border-[#F0F4F2]">
                    <span class="text-xs text-[#66756F] font-medium">Ngân hàng</span>
                    <span class="text-sm font-bold text-[#123F35]">{{ BANK_NAME }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2.5 border-b border-[#F0F4F2]">
                    <span class="text-xs text-[#66756F] font-medium">Chủ tài khoản</span>
                    <span class="text-sm font-bold text-[#123F35] uppercase">{{ ACCOUNT_NAME }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2.5 border-b border-[#F0F4F2]">
                    <span class="text-xs text-[#66756F] font-medium">Số tài khoản</span>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-mono font-bold text-[#087F5B]">{{ ACCOUNT_NO }}</span>
                      <button @click="copyText(ACCOUNT_NO, 'số tài khoản')"
                        class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#EBF4EF] hover:bg-[#D8EDE3] text-[#087F5B] transition">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </button>
                    </div>
                  </div>
                  <div class="flex items-start justify-between py-2.5">
                    <span class="text-xs text-[#66756F] font-medium">Nội dung CK</span>
                    <div class="flex items-center gap-2 max-w-[180px] text-right">
                      <span class="text-xs font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5 leading-tight">{{ transferContent }}</span>
                      <button @click="copyText(transferContent, 'nội dung chuyển khoản')"
                        class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA Buttons -->
              <div class="space-y-3 pt-2">
                <!-- Verifying state shows different button -->
                <template v-if="paymentStatus === 'verifying'">
                  <div class="w-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold py-3.5 rounded-2xl text-sm text-center">
                    🔍 Hệ thống đang kiểm tra giao dịch của bạn...
                  </div>
                </template>
                <template v-else>
                  <button @click="handleIHavePaid" :disabled="submitting"
                    class="w-full bg-[#087F5B] hover:bg-[#006B4A] text-white font-extrabold py-3.5 rounded-2xl transition text-sm shadow-md shadow-emerald-800/15 flex items-center justify-center gap-2 disabled:opacity-50">
                    <span v-if="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    {{ submitting ? 'Đang gửi...' : '✅ Tôi đã chuyển khoản' }}
                  </button>
                </template>

                <button @click="handleCancel"
                  class="w-full border border-[#DCE6E1] text-[#66756F] hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-semibold py-3 rounded-2xl transition text-sm">
                  Hủy thanh toán
                </button>
              </div>

              <!-- Notes -->
              <div class="bg-[#FFFBEB] border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                <p class="text-xs font-bold text-amber-800">⚠️ Lưu ý quan trọng:</p>
                <ul class="text-xs text-amber-700 space-y-1 leading-relaxed">
                  <li>• Không đóng trang trong khi hệ thống đang kiểm tra thanh toán.</li>
                  <li>• Vui lòng chuyển <strong>đúng số tiền</strong> được hiển thị.</li>
                  <li>• Nội dung chuyển khoản phải <strong>chính xác</strong> để hệ thống xác nhận tự động.</li>
                  <li>• Sau khi xác nhận, admin sẽ duyệt đơn trong <strong>1–24 giờ</strong>.</li>
                </ul>
              </div>
            </div>

          </div><!-- /grid -->
        </div><!-- /card -->

        <!-- Back link -->
        <div class="text-center mt-5">
          <button @click="handleGoToOrders" class="text-xs text-[#66756F] hover:text-[#087F5B] transition underline underline-offset-2">
            ← Quay lại danh sách đơn hàng
          </button>
        </div>

      </div>
    </main>
  </div>
</template>
