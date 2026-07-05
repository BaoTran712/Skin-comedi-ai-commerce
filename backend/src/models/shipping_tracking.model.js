import mongoose from "mongoose";

const shippingTrackingSchema = mongoose.Schema({
    order_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    description: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

const ShippingTracking = mongoose.model("ShippingTracking", shippingTrackingSchema);
export default ShippingTracking;
