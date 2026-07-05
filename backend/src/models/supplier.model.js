import mongoose from "mongoose";

const supplierSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }
}, { timestamps: true });

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
