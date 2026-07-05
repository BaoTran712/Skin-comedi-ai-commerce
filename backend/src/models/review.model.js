import mongoose from "mongoose";

const reviewSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    product_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
    },
    reply: {
        type: String,
    },
},
    {
        timestamps: true,
    }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
