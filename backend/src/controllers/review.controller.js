import ReviewService from "../services/review.service.js";
import ApiError from "../api-error.js";
import Setting from "../models/setting.model.js";

const reviewService = new ReviewService();

export async function create(req, res, next) {
    if (!req.body?.user_id || !req.body?.product_id) {
        return next(new ApiError(400, "User ID and Product ID are required"));
    }
    try {
        let status = 'approved';
        const requireApprovalSetting = await Setting.findOne({ khoa_cau_hinh: 'comment_require_approval' });
        if (requireApprovalSetting && requireApprovalSetting.gia_tri === 'true') {
            status = 'hidden';
        }

        const reviewData = { ...req.body, status };
        const document = await reviewService.create(reviewData);
        return res.status(201).json(document);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "Error while creating review"));
    }
}

export async function findAll(req, res, next) {
    try {
        const documents = await reviewService.find({});
        return res.json(documents);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "An error occurred while retrieving reviews"));
    }
}

export async function findByUserId(req, res, next) {
    try {
        const documents = await reviewService.findByUserId(req.params.userId);
        return res.json(documents);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "Error while retrieving reviews for user"));
    }
}

export async function findByProductId(req, res, next) {
    try {
        const documents = await reviewService.findByProductId(req.params.productId);
        return res.json(documents);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "Error while retrieving reviews for product"));
    }
}

export async function findOne(req, res, next) {
    try {
        const document = await reviewService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Review not found"));
        }
        return res.json(document);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Error while retrieving review with id ${req.params.id}`));
    }
}

export async function update(req, res, next) {
    try {
        const document = await reviewService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, "Review not found"));
        }
        return res.json({ message: "Review updated successfully", document });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Error while updating review with id ${req.params.id}`));
    }
}

export async function deleteOne(req, res, next) {
    try {
        const document = await reviewService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Review not found"));
        }
        return res.json({ message: "Review deleted successfully" });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Could not delete review with id ${req.params.id}`));
    }
}

export default {
    create, findAll, findByUserId, findByProductId, findOne, update, deleteOne
};
