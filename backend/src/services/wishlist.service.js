import Wishlist from "../models/wishlist.model.js";

class WishlistService {
    async getWishlist(userId) {
        let wishlist = await Wishlist.findOne({ user_id: userId }).populate({
            path: "products",
            populate: { path: "brand_id" }
        });
        
        if (!wishlist) {
            wishlist = new Wishlist({ user_id: userId, products: [] });
            await wishlist.save();
        }
        return wishlist;
    }

    async addProduct(userId, productId) {
        let wishlist = await Wishlist.findOne({ user_id: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user_id: userId, products: [] });
        }
        
        // Sử dụng $addToSet của MongoDB để tránh trùng lặp sản phẩm
        await Wishlist.updateOne(
            { user_id: userId },
            { $addToSet: { products: productId } },
            { upsert: true }
        );

        return await this.getWishlist(userId);
    }

    async removeProduct(userId, productId) {
        await Wishlist.updateOne(
            { user_id: userId },
            { $pull: { products: productId } }
        );
        
        return await this.getWishlist(userId);
    }
}

export default WishlistService;
