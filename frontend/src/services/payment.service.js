import ApiClient from "./api.service";

class PaymentService {
  constructor(baseUrl = "/api/payment") {
    this.api = ApiClient(baseUrl);
  }

  async createVnpayUrl(data) {
    return (await this.api.post("/vnpay-create", data)).data;
  }
}

export default PaymentService;
