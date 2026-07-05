import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
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
        type: String,
        required: true,
    },
    phone_number: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
        default: "pending",
    },
    carrier_name: {
        type: String,
    },
    tracking_number: {
        type: String,
    },
    subtotal: {
        type: Number,
        default: 0,
        required: true,
    },
    discount_amount: {
        type: Number,
        default: 0,
    },
    total_amount: {
        type: Number,
        default: 0,
        required: true,
    },
},
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
