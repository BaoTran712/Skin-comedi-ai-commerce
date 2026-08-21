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
        enum: ["COD", "BANK_TRANSFER", "VIETQR", "VNPAY", "MOMO"],
        default: "COD",
    },
    payment_status: {
        type: String,
        enum: ["unpaid", "verifying", "paid", "refunded", "expired"],
        default: "unpaid",
    },
    // Timestamp when customer clicked "I have paid" button
    customer_confirmed_at: {
        type: Date,
    },
    // Admin/system notes on payment verification
    payment_note: {
        type: String,
    },
    amount: {
        type: Number,
        required: true,
    },
    transaction_id: {
        type: String,
    },
    // Transfer content that customer should use
    transfer_content: {
        type: String,
    },
    // MoMo specific tracking fields
    momo_trans_id: {
        type: String,
    },
    momo_result_code: {
        type: Number,
    },
    paid_at: {
        type: Date,
    }
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
