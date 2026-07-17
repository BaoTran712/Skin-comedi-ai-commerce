import Setting from "../models/setting.model.js";
import ApiError from "../api-error.js";

// Tạo mới cấu hình
export const createSetting = async (req, res, next) => {
    try {
        const { khoa_cau_hinh, gia_tri, mo_ta } = req.body;
        if (!khoa_cau_hinh) {
            return next(new ApiError(400, "Khóa cấu hình là bắt buộc"));
        }
        
        const existingSetting = await Setting.findOne({ khoa_cau_hinh });
        if (existingSetting) {
            return next(new ApiError(400, "Khóa cấu hình đã tồn tại"));
        }

        const setting = await Setting.create({ khoa_cau_hinh, gia_tri, mo_ta });
        return res.status(201).json(setting);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi tạo cấu hình"));
    }
};

// Lấy tất cả cấu hình
export const getAllSettings = async (req, res, next) => {
    try {
        const settings = await Setting.find({});
        return res.status(200).json(settings);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi lấy danh sách cấu hình"));
    }
};

// Lấy cấu hình theo khóa
export const getSettingByKey = async (req, res, next) => {
    try {
        const { key } = req.params;
        const setting = await Setting.findOne({ khoa_cau_hinh: key });
        if (!setting) {
            return next(new ApiError(404, "Không tìm thấy cấu hình"));
        }
        return res.status(200).json(setting);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi lấy cấu hình"));
    }
};

// Cập nhật cấu hình (theo ID)
export const updateSetting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { gia_tri, mo_ta } = req.body;
        
        const setting = await Setting.findByIdAndUpdate(
            id,
            { gia_tri, mo_ta },
            { new: true }
        );
        
        if (!setting) {
            return next(new ApiError(404, "Không tìm thấy cấu hình"));
        }
        return res.status(200).json(setting);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi cập nhật cấu hình"));
    }
};

// Xóa cấu hình
export const deleteSetting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const setting = await Setting.findByIdAndDelete(id);
        if (!setting) {
            return next(new ApiError(404, "Không tìm thấy cấu hình"));
        }
        return res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi xóa cấu hình"));
    }
};
