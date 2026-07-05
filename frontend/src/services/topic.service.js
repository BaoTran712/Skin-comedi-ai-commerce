import ApiClient from "./api.service";

class TopicService {
  constructor(baseUrl = "/api/topic") {
    this.api = ApiClient(baseUrl);
  }

  async getAllTopics() {
    return (await this.api.get("/")).data;
  }

  async getTopicById(id) {
    return (await this.api.get(`/${id}`)).data;
  }

  async createTopic(data) {
    return (await this.api.post("/", data)).data;
  }

  async updateTopic(id, data) {
    return (await this.api.put(`/${id}`, data)).data;
  }

  async deleteTopic(id) {
    return (await this.api.delete(`/${id}`)).data;
  }
}

export default TopicService;
