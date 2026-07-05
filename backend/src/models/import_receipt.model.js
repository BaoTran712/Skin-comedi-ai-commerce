import mongoose from "mongoose";

const importReceiptSchema = mongoose.Schema({
    staff_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Staff",
        required: true,
    },
    supplier_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Supplier",
        required: true,
    },
    import_date: {
        type: Date,
        default: Date.now,
    },
    total_amount: {
        type: Number,
        default: 0,
    },
    note: {
        type: String,
    }
}, { timestamps: true });

const ImportReceipt = mongoose.model("ImportReceipt", importReceiptSchema);
export default ImportReceipt;
