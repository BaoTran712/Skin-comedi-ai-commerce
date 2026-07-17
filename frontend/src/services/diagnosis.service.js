import ApiClient from "./api.service";

class DiagnosisService {
  constructor(baseUrl = "/api/diagnosis") {
    this.api = ApiClient(baseUrl);
  }

  async getLatestDiagnosis(userId) {
    return (await this.api.get(`/latest/${userId}`)).data;
  }

  async getDiagnosisHistory(userId) {
    return (await this.api.get(`/history/${userId}`)).data;
  }

  async createDiagnosis(data) {
    return (await this.api.post("/", data)).data;
  }
}

export default DiagnosisService;
