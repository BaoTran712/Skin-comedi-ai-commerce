import createApiClient from "./api.service";

class WishlistService {
    constructor(baseUrl = "/api/wishlist") {
        this.api = createApiClient(baseUrl);
    }
    
    async getWishlist() {
        return (await this.api.get("/")).data;
    }

    async addProduct(productId) {
        return (await this.api.post(`/${productId}`)).data;
    }

    async removeProduct(productId) {
        return (await this.api.delete(`/${productId}`)).data;
    }
}

export default new WishlistService();
