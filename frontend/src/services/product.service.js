import ApiClient from "./api.service";

class ProductService {
  constructor(baseUrl = "/api/product") {
    this.api = ApiClient(baseUrl);
  }

  async getAllProducts() {
    return (await this.api.get("/")).data;
  }

  async createProduct(data) {
    try {
      const response = await this.api.post("/", data);
      return response.data;
    } catch (error) {
      console.error("Error create product:", error.response || error);
      throw error;
    }
  }

  async uploadImage(id, formData) {
    try {
      const response = await this.api.post(`/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error upload product image:", error.response || error);
      throw error;
    }
  }

  async getProduct(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async updateProduct(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteProduct(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  async deleteAllProducts() {
    return (await this.api.delete("/")).data;
  }
}

export default ProductService;
