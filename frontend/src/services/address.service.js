import ApiClient from "./api.service";

class AddressService {
  constructor(baseUrl = "/api/address") {
    this.api = ApiClient(baseUrl);
  }

  async getAddresses() {
    return (await this.api.get("/")).data;
  }

  async addAddress(data) {
    return (await this.api.post("/", data)).data;
  }

  async updateAddress(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async setDefaultAddress(id) {
    return (await this.api.put(`/${id}/default`)).data;
  }

  async deleteAddress(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default AddressService;
