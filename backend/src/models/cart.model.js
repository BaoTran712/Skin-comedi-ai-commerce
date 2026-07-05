import mongoose from "mongoose";

const cartSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
        unique: true, // Each user has one cart
    },
    items: [{
        product_id: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        }
    }]
},
    {
        timestamps: true,
    }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
