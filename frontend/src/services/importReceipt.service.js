import ApiClient from "./api.service";

class ImportReceiptService {
  constructor(baseUrl = "/api/import-receipt") {
    this.api = ApiClient(baseUrl);
  }

  async getAllReceipts() {
    return (await this.api.get("/")).data;
  }

  async getReceiptById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createReceipt(data) {
    return (await this.api.post("/", data)).data;
  }
}

export default ImportReceiptService;
