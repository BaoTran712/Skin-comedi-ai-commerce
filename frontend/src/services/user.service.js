import ApiClient from "./api.service";

class UserService {
  constructor(baseUrl = "/api/user") {
    this.api = ApiClient(baseUrl);
  }

  async getAllUsers() {
    return (await this.api.get("/")).data;
  }

  async getUser(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async updateUser(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async update(id, data) {
    return await this.updateUser(id, data);
  }

  async deleteUser(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  async deleteAllUsers() {
    return (await this.api.delete("/")).data;
  }

  async register(data) {
    try {
      const response = await this.api.post("/register", data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async login(username, password) {
    try {
      const response = await this.api.post("/login", { username, password });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async verifyOTP(username, otp) {
    try {
      const response = await this.api.post("/verify-otp", { username, otp });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async resendOTP(username) {
    try {
      const response = await this.api.post("/resend-otp", { username });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserPoints() {
    try {
      const response = await this.api.get("/points");
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default UserService;
