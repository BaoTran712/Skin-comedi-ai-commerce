import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
        },
        attributes: [
            {
                name: { type: String, required: true }, // e.g., "Màu sắc", "Kích thước"
                value: { type: String, required: true }, // e.g., "Đỏ", "M"
            }
        ],
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        image: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// Map _id to id
variantSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const Variant = mongoose.model("Variant", variantSchema);

export default Variant;
