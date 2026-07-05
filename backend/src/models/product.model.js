import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    expiry_date: {
        type: String, // Changed to string for flexibility like "12/2026"
        required: true,
    },
    brand_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Brand",
    },
    category_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
    },
    usage: {
        type: String,
        required: true,
    },
    skin_type: {
        type: [String], // Array like ["da dầu", "da nhạy cảm"]
        default: [],
    },
    pathology: {
        type: [String], // Array like ["mụn", "nám"]
        default: [],
    },
    image: {
        type: String, // URL for product image
        default: "",
    },
    flash_sale_price: {
        type: Number,
        default: null,
    },
    flash_sale_end_time: {
        type: Date,
        default: null,
    },
},
    {
        timestamps: true,
    }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
