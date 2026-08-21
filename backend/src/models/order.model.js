import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    order_code: {
        type: String,
        unique: true,
        sparse: true,
    },
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    staff_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Staff",
    },
    promotion_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Promotion",
    },
    order_date: {
        type: Date,
        default: Date.now,
        required: true,
    },
    delivery_date: {
        type: Date,
    },
    shipping_address: {
        recipientName: { type: String, trim: true },
        provinceCode: { type: String, required: true },
        provinceName: { type: String, required: true },
        districtCode: { type: String, required: true },
        districtName: { type: String, required: true },
        wardCode: { type: String, required: true },
        wardName: { type: String, required: true },
        addressDetail: { type: String, required: true, trim: true },
    },
    phone_number: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipping", "delivered", "completed", "cancelled", "return_requested", "returning", "returned", "refunded"],
        default: "pending",
    },
    return_reason: {
        type: String,
        trim: true,
    },
    return_note: {
        type: String,
        trim: true,
    },
    return_date: {
        type: Date,
    },
    refund_amount: {
        type: Number,
    },
    payment_method: {
        type: String,
        enum: ["COD", "VNPAY", "BANK_TRANSFER", "VIETQR", "MOMO"],
        default: "COD",
    },
    shipping_method: {
        type: String,
        enum: ["standard", "express"],
        default: "standard",
    },
    shipping_fee: {
        type: Number,
        default: 0,
    },
    carrier_name: {
        type: String,
    },
    tracking_number: {
        type: String,
    },
    shipment_history: [{
        status: { type: String, enum: ["pending","confirmed","shipping","delivered","completed","cancelled", "return_requested", "returning", "returned", "refunded"], required: true },
        updatedAt: { type: Date, default: Date.now },
        description: { type: String }
    }],
    subtotal: {
        type: Number,
        default: 0,
        required: true,
    },
    discount_amount: {
        type: Number,
        default: 0,
    },
    discount_voucher: {
        type: Number,
        default: 0,
    },
    discount_points: {
        type: Number,
        default: 0,
    },
    points_used: {
        type: Number,
        default: 0,
    },
    total_amount: {
        type: Number,
        default: 0,
        required: true,
    },
    note: {
        type: String,
        default: "",
    },
    points_earned: {
        type: Number,
        default: 0,
    },
    points_credited: {
        type: Boolean,
        default: false,
    },
    coin_toss_eligible: {
        type: Boolean,
        default: true,
    },
},
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
