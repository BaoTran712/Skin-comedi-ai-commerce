import mongoose from "mongoose";

const importReceiptDetailSchema = mongoose.Schema({
    import_receipt_id: {
        type: mongoose.Schema.ObjectId,
        ref: "ImportReceipt",
        required: true,
    },
    product_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    import_price: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

const ImportReceiptDetail = mongoose.model("ImportReceiptDetail", importReceiptDetailSchema);
export default ImportReceiptDetail;
