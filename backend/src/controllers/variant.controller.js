import Variant from "../models/variant.model.js";
import ApiError from "../api-error.js";

export const createVariant = async (req, res, next) => {
    try {
        const variant = await Variant.create(req.body);
        return res.status(201).json(variant);
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Lỗi khi tạo biến thể"));
    }
};

export const getVariantsByProductId = async (req, res, next) => {
    try {
        const variants = await Variant.find({ product_id: req.params.productId });
        return res.status(200).json(variants);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi lấy danh sách biến thể"));
    }
};

export const updateVariant = async (req, res, next) => {
    try {
        const variant = await Variant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!variant) return next(new ApiError(404, "Không tìm thấy biến thể"));
        return res.status(200).json(variant);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi cập nhật biến thể"));
    }
};

export const deleteVariant = async (req, res, next) => {
    try {
        const variant = await Variant.findByIdAndDelete(req.params.id);
        if (!variant) return next(new ApiError(404, "Không tìm thấy biến thể"));
        return res.status(200).json({ message: "Đã xóa biến thể" });
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi xóa biến thể"));
    }
};
