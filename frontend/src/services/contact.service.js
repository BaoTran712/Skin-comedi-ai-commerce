import ApiClient from "./api.service";

class ContactService {
  constructor(baseUrl = "/api/contact") {
    this.api = ApiClient(baseUrl);
  }

  async getAllContacts() {
    return (await this.api.get("/")).data;
  }

  async getContactById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async updateContactStatus(id, status) {
    return (await this.api.put(`/${id}/status`, { trang_thai: status })).data;
  }

  async deleteContact(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default ContactService;
