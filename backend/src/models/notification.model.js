import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                "ORDER_CREATED",
                "ORDER_CONFIRMED",
                "ORDER_SHIPPING",
                "ORDER_DELIVERED",
                "ORDER_CANCELLED",
                "VOUCHER",
                "PROMOTION",
                "SYSTEM",
                "order",
                "borrow",
                "PRICE_DROP",
                "BACK_IN_STOCK",
                "LOW_STOCK"
            ],
            default: "SYSTEM",
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        referenceId: {
            type: String,
            default: null,
        },
        link: {
            type: String,
            default: "/ordercheck",
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
