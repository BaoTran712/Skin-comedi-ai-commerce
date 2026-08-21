import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    ho_ten: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    so_dien_thoai: { type: String, required: true, trim: true },
    tieu_de: { type: String, default: "Tư vấn chăm sóc da liễu" },
    noi_dung: { type: String, required: true, trim: true },
    tinh_trang_da: { type: String, default: "" },
    trang_thai: { type: String, enum: ["pending", "processed"], default: "pending" },
    ngay_gui: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);
