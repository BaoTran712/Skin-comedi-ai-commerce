import mongoose from "mongoose";

const pointTransactionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ["EARN", "SPEND", "REFUND", "ADJUST"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balance_after: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    adjusted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    reason: {
        type: String,
        default: ""
    }
}, { timestamps: true });

export default mongoose.model("PointTransaction", pointTransactionSchema);
