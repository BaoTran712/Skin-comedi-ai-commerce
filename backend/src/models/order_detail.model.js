import mongoose from "mongoose";

const orderDetailSchema = mongoose.Schema({
    order_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
        required: true,
    },
    product_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
    },
    variant_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Variant",
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price_at_purchase: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

const OrderDetail = mongoose.model("OrderDetail", orderDetailSchema);
export default OrderDetail;
