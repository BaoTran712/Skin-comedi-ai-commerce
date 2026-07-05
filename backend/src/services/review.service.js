import Review from "../models/review.model.js";

class ReviewService {
    async create(payload) {
        try {
            const reviewData = {
                user_id: payload.user_id,
                product_id: payload.product_id,
                rating: payload.rating,
                comment: payload.comment,
                reply: payload.reply || "",
            };
            const review = new Review(reviewData);
            return await review.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async find(filter) {
        return await Review.find(filter).populate("user_id").populate("product_id");
    }

    async findById(id) {
        return await Review.findOne({ _id: id }).populate("user_id").populate("product_id");
    }

    async findByUserId(userId) {
        return await Review.find({ user_id: userId }).populate("product_id");
    }

    async findByProductId(productId) {
        return await Review.find({ product_id: productId }).populate("user_id");
    }

    async update(id, payload) {
        const result = await Review.findByIdAndUpdate(
            id, { $set: payload }, { new: true, runValidators: true }
        );
        return result;
    }

    async delete(id) {
        const result = await Review.findByIdAndDelete(id);
        return result;
    }

    async deleteAll() {
        const result = await Review.deleteMany({});
        return result.deletedCount;
    }
}

export default ReviewService;
