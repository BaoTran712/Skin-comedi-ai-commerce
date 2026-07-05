import mongoose from "mongoose";

const promotionSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
    },
    discount_type: {
        type: String,
        enum: ["percentage", "fixed_amount"],
        required: true,
    },
    discount_value: {
        type: Number,
        required: true,
    },
    start_date: {
        type: Date,
        required: true,
    },
    end_date: {
        type: Date,
        required: true,
    },
    min_order_value: {
        type: Number,
        default: 0,
    },
    max_discount_amount: {
        type: Number,
        default: null,
    },
    usage_limit: {
        type: Number,
        default: null, // null means unlimited
    },
    used_count: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["active", "inactive", "expired"],
        default: "active",
    }
}, { timestamps: true });

const Promotion = mongoose.model("Promotion", promotionSchema);
export default Promotion;
