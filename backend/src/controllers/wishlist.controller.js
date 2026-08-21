import WishlistService from "../services/wishlist.service.js";
import ApiError from "../api-error.js";
import mongoose from "mongoose";

const wishlistService = new WishlistService();

export async function getWishlist(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return next(new ApiError(401, "Yêu cầu đăng nhập"));
        }
        const wishlist = await wishlistService.getWishlist(userId);
        res.json(wishlist);
    } catch (error) {
        console.error("Get Wishlist Error:", error);
        next(error);
    }
}

export async function addProduct(req, res, next) {
    try {
        const userId = req.userId;
        const productId = req.params.productId;

        if (!userId) {
            return next(new ApiError(401, "Yêu cầu đăng nhập"));
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return next(new ApiError(400, "Mã sản phẩm không hợp lệ"));
        }

        const wishlist = await wishlistService.addProduct(userId, productId);
        res.json({ message: "Đã thêm vào danh sách yêu thích", wishlist });
    } catch (error) {
        console.error("Add Wishlist Error:", error);
        next(error);
    }
}

export async function removeProduct(req, res, next) {
    try {
        const userId = req.userId;
        const productId = req.params.productId;

        if (!userId) {
            return next(new ApiError(401, "Yêu cầu đăng nhập"));
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return next(new ApiError(400, "Mã sản phẩm không hợp lệ"));
        }

        const wishlist = await wishlistService.removeProduct(userId, productId);
        res.json({ message: "Đã xóa khỏi danh sách yêu thích", wishlist });
    } catch (error) {
        console.error("Remove Wishlist Error:", error);
        next(error);
    }
}

export default {
    getWishlist,
    addProduct,
    removeProduct
};
