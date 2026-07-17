import ApiClient from "./api.service";

class PostService {
  constructor(baseUrl = "/api/post") {
    this.api = ApiClient(baseUrl);
  }

  async getAllPosts() {
    return (await this.api.get("/")).data;
  }

  async getPostById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createPost(data) {
    return (await this.api.post("/", data)).data;
  }

  async updatePost(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deletePost(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default PostService;
