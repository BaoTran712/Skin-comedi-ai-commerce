import ApiClient from "./api.service";

class ReviewService {
  constructor(baseUrl = "/api/review") {
    this.api = ApiClient(baseUrl);
  }

  async getAllReviews() {
    return (await this.api.get("/")).data;
  }

  async createReview(data) {
    return (await this.api.post("/", data)).data;
  }

  async getReview(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async updateReview(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteReview(id) {
    return (await this.api.delete(`/${id}`)).data;
  }

  async getReviewsByUserId(userId) {
    return (await this.api.get(`/user/${userId}`)).data;
  }

  async getReviewsByProductId(productId) {
    return (await this.api.get(`/product/${productId}`)).data;
  }
}

export default ReviewService;
