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
    has_variants: {
        type: Boolean,
        default: false,
    },
    prescription_required: {
        type: Boolean,
        default: false,
    },
    origin_country: {
        type: String,
        default: "Việt Nam",
    },
    contraindications: {
        type: String,
        default: "",
    },
    side_effects: {
        type: String,
        default: "",
    },
    warnings: {
        type: String,
        default: "",
    },
    pregnancy_warning: {
        type: String,
        default: "",
    },
    children_warning: {
        type: String,
        default: "",
    },
    batch_number: {
        type: String,
        default: "BCH-001",
    },
    images: {
        type: [String],
        default: [],
    },
},
    {
        timestamps: true,
    }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
