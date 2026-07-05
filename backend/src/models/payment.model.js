import mongoose from "mongoose";

const paymentSchema = mongoose.Schema({
    order_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
        required: true,
    },
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    payment_method: {
        type: String,
        enum: ["COD", "BANK_TRANSFER", "VNPAY", "MOMO"],
        default: "COD",
    },
    payment_status: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid",
    },
    amount: {
        type: Number,
        required: true,
    },
    transaction_id: {
        type: String,
    }
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
