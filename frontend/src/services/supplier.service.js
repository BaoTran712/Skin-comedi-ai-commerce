import ApiClient from "./api.service";

class SupplierService {
  constructor(baseUrl = "/api/supplier") {
    this.api = ApiClient(baseUrl);
  }

  async getAllSuppliers() {
    return (await this.api.get("/")).data;
  }

  async getSupplierById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createSupplier(data) {
    return (await this.api.post("/", data)).data;
  }

  async updateSupplier(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteSupplier(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default SupplierService;
