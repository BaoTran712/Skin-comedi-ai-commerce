import ApiClient from "./api.service";

class ShippingService {
  constructor(baseUrl = "/api/shipping") {
    this.api = ApiClient(baseUrl);
  }

  async getShippingMethods() {
    return (await this.api.get("/methods")).data;
  }
}

export default ShippingService;
