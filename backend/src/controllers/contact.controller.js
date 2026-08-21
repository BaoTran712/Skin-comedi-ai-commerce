import Contact from "../models/contact.model.js";
import ApiError from "../api-error.js";

export async function create(req, res, next) {
    try {
        const { ho_ten, email, so_dien_thoai, tieu_de, noi_dung, tinh_trang_da } = req.body;
        if (!ho_ten || !so_dien_thoai || !noi_dung) {
            return next(new ApiError(400, "Vui lòng nhập Họ tên, Số điện thoại và Lời nhắn"));
        }

        const contact = new Contact({
            ho_ten,
            email: email || "",
            so_dien_thoai,
            tieu_de: tieu_de || (tinh_trang_da ? `Tư vấn da: ${tinh_trang_da}` : "Tư vấn chăm sóc da liễu"),
            noi_dung,
            tinh_trang_da: tinh_trang_da || "",
        });

        await contact.save();
        return res.status(201).json({ success: true, message: "Gửi yêu cầu tư vấn thành công!", contact });
    } catch (error) {
        console.error("Create Contact Error:", error);
        return next(new ApiError(500, "Lỗi server khi gửi liên hệ"));
    }
}

export async function findAll(req, res, next) {
    try {
        const contacts = await Contact.find({}).sort({ createdAt: -1 });
        const formatted = contacts.map(c => ({
            id: c._id,
            _id: c._id,
            ho_ten: c.ho_ten,
            email: c.email,
            so_dien_thoai: c.so_dien_thoai,
            tieu_de: c.tieu_de,
            noi_dung: c.noi_dung,
            tinh_trang_da: c.tinh_trang_da,
            trang_thai: c.trang_thai,
            ngay_gui: c.createdAt || c.ngay_gui
        }));
        return res.json(formatted);
    } catch (error) {
        return next(new ApiError(500, "Lỗi lấy danh sách liên hệ"));
    }
}

export async function findOne(req, res, next) {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return next(new ApiError(404, "Không tìm thấy tin nhắn"));
        return res.json({
            id: contact._id,
            _id: contact._id,
            ho_ten: contact.ho_ten,
            email: contact.email,
            so_dien_thoai: contact.so_dien_thoai,
            tieu_de: contact.tieu_de,
            noi_dung: contact.noi_dung,
            tinh_trang_da: contact.tinh_trang_da,
            trang_thai: contact.trang_thai,
            ngay_gui: contact.createdAt || contact.ngay_gui
        });
    } catch (error) {
        return next(new ApiError(500, "Lỗi lấy thông tin liên hệ"));
    }
}

export async function updateStatus(req, res, next) {
    try {
        const { trang_thai } = req.body;
        const contact = await Contact.findByIdAndUpdate(req.params.id, { trang_thai }, { new: true });
        if (!contact) return next(new ApiError(404, "Không tìm thấy tin nhắn"));
        return res.json({ success: true, message: "Cập nhật trạng thái thành công", contact });
    } catch (error) {
        return next(new ApiError(500, "Lỗi cập nhật trạng thái tin nhắn"));
    }
}

export async function deleteOne(req, res, next) {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return next(new ApiError(404, "Không tìm thấy tin nhắn"));
        return res.json({ success: true, message: "Xóa tin nhắn thành công" });
    } catch (error) {
        return next(new ApiError(500, "Lỗi xóa tin nhắn"));
    }
}

export default { create, findAll, findOne, updateStatus, deleteOne };
