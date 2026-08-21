import ApiClient from "./api.service";

class PaymentService {
  constructor(baseUrl = "/api/payment") {
    this.api = ApiClient(baseUrl);
  }

  // ── VNPAY (existing) ──────────────────────────────────────
  async createVnpayUrl(data) {
    return (await this.api.post("/vnpay-create", data)).data;
  }

  // ── MOMO SANDBOX ──────────────────────────────────────────
  async createMomoUrl(data) {
    return (await this.api.post("/momo-create", data)).data;
  }

  // ── BANK TRANSFER / VIETQR ────────────────────────────────

  /**
   * Customer confirms they have transferred.
   * Backend sets payment_status = "verifying" (NOT "paid").
   */
  async bankTransferRequest(orderId) {
    return (await this.api.post("/bank-transfer-request", { order_id: orderId })).data;
  }

  /**
   * Poll the payment status of an order.
   * Returns: { payment_status, order_code, amount, ... }
   */
  async getPaymentStatus(orderId) {
    return (await this.api.get(`/status/${orderId}`)).data;
  }

  /**
   * Admin manually confirms bank transfer payment.
   * Requires STAFF/ADMIN auth.
   */
  async adminConfirmPayment(orderId, data = {}) {
    return (await this.api.post(`/admin-confirm/${orderId}`, data)).data;
  }
}

export default PaymentService;
