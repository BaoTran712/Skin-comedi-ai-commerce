import StaffService from "../services/staff.service.js";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";
import ApiError from "../api-error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const staffService = new StaffService();
dotenv.config();

export async function create(req, res, next) {
    const { username, password } = req.body;
    if (!username || !password) {
        return next(new ApiError(400, "Tên đăng nhập (Email) và Mật khẩu là bắt buộc"));
    }
    try {
        const existingStaff = await staffService.findByUsername(username);
        const existingUser = await User.findOne({ username });
        if (existingStaff || existingUser) {
            return next(new ApiError(409, "Tên đăng nhập/Email này đã tồn tại trong hệ thống"));
        }

        const newStaff = await staffService.create(req.body);
        return res.status(201).json({ success: true, message: "Tạo tài khoản nhân viên thành công", staff: newStaff });
    } catch (error) {
        console.error("Create Staff Error:", error);
        return next(new ApiError(500, error.message || "Lỗi server khi tạo tài khoản nhân viên"));
    }
}

export async function findAll(req, res, next) {
    let documents = [];
    try {
        const { name } = req.query;
        if (name) {
            documents = await staffService.findByName(name);
        } else {
            documents = await staffService.find({});
        }
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách nhân viên"));
    }
    return res.json(documents);
}

export async function findOne(req, res, next) {
    try {
        const document = await staffService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy thông tin nhân viên"));
        }
        return res.json(document);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Lỗi khi lấy thông tin nhân viên id ${req.params.id}`));
    }
}

export async function update(req, res, next) {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Dữ liệu cập nhật không được trống"));
    }

    const requesterId = req.user?.id;
    const requesterRole = (req.user?.role || "").toUpperCase();
    const targetId = req.params.id;

    // 1. Phân quyền: Nhân viên chỉ được tự sửa tài khoản của mình. Admin được sửa tất cả.
    if (requesterRole !== "ADMIN" && requesterId !== targetId) {
        return next(new ApiError(403, "Bạn không có quyền chỉnh sửa tài khoản nhân viên này"));
    }

    // 2. Trường thông tin nhạy cảm: Chỉ ADMIN mới được thay đổi role hoặc status
    if (req.body.role || req.body.status) {
        if (requesterRole !== "ADMIN") {
            return next(new ApiError(403, "Chỉ ADMIN mới có quyền thay đổi vai trò hoặc trạng thái nhân viên"));
        }

        // Cơ chế bảo vệ Admin trong bộ sưu tập Staff (không cho Admin này khóa/đổi quyền Admin khác)
        if (req.body.role && req.body.role !== "ADMIN") {
            const targetStaff = await Staff.findById(targetId);
            if (targetStaff && targetStaff.role === "ADMIN" && targetId !== requesterId) {
                return next(new ApiError(403, "Không thể hạ quyền của quản trị viên khác"));
            }
        }
        if (req.body.status && req.body.status !== "ACTIVE") {
            const targetStaff = await Staff.findById(targetId);
            if (targetStaff && targetStaff.role === "ADMIN" && targetId !== requesterId) {
                return next(new ApiError(403, "Không thể khóa tài khoản của quản trị viên khác"));
            }
        }

        if (req.body.role) {
            req.body.role = req.body.role.toUpperCase();
        }
    }

    // 3. Xử lý đổi mật khẩu cho nhân viên
    if (req.body.password !== undefined) {
        const newPassword = req.body.password;
        if (!newPassword || newPassword.trim() === "") {
            return next(new ApiError(400, "Mật khẩu mới không được để trống"));
        }
        if (newPassword.length < 3 || newPassword.length > 30) {
            return next(new ApiError(400, "Mật khẩu mới phải từ 3 đến 30 ký tự"));
        }

        // Nếu chính nhân viên đang đổi mật khẩu của mình, bắt buộc phải cung cấp và xác minh mật khẩu hiện tại
        if (requesterId === targetId) {
            const { currentPassword } = req.body;
            if (!currentPassword) {
                return next(new ApiError(400, "Vui lòng cung cấp mật khẩu hiện tại để đổi mật khẩu"));
            }

            const staffInDb = await Staff.findById(targetId);
            if (!staffInDb || !staffInDb.password) {
                return next(new ApiError(404, "Không tìm thấy thông tin nhân viên"));
            }

            const isMatch = await bcrypt.compare(currentPassword, staffInDb.password);
            if (!isMatch) {
                return next(new ApiError(400, "Mật khẩu hiện tại không chính xác"));
            }

            const isSameAsOld = await bcrypt.compare(newPassword, staffInDb.password);
            if (isSameAsOld) {
                return next(new ApiError(400, "Mật khẩu mới không được trùng với mật khẩu cũ"));
            }
        } else {
            // Admin đổi mật khẩu cho nhân viên, bảo vệ không cho đổi mật khẩu Admin khác
            const targetStaff = await Staff.findById(targetId);
            if (targetStaff && targetStaff.role === "ADMIN") {
                return next(new ApiError(403, "Không thể đổi mật khẩu của quản trị viên khác"));
            }
        }

        // Xóa mật khẩu hiện tại để tránh lưu vào db
        delete req.body.currentPassword;
    }

    try {
        if (req.body.username) {
            const existingStaff = await staffService.findByUsername(req.body.username);
            if (existingStaff && existingStaff._id.toString() !== targetId) {
                return next(new ApiError(409, "Tên đăng nhập/Email đã được sử dụng bởi nhân viên khác"));
            }
        }
        const document = await staffService.update(targetId, req.body);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy thông tin nhân viên"));
        }

        // Ẩn mật khẩu khi phản hồi
        const staffObj = document.toObject ? document.toObject() : { ...document };
        delete staffObj.password;

        return res.json({ message: "Cập nhật nhân viên thành công", document: staffObj });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Lỗi khi cập nhật nhân viên id ${targetId}`));
    }
}

export async function deleteOne(req, res, next) {
    try {
        const document = await staffService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy thông tin nhân viên"));
        }
        return res.send({ message: "Xóa nhân viên thành công" });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Lỗi khi xóa nhân viên id ${req.params.id}`));
    }
}

export async function deleteAll(req, res, next) {
    try {
        const deleteCount = await staffService.deleteAll();
        return res.send({
            message: `Đã xóa ${deleteCount} tài khoản nhân viên thành công`,
        });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "Đã xảy ra lỗi khi xóa danh sách nhân viên"));
    }
}

export async function login(req, res, next) {
    if (!req.body?.username || !req.body?.password) {
        return next(new ApiError(400, "Tên đăng nhập và Mật khẩu không được trống"));
    }
    try {
        const staff = await staffService.findByUsername(req.body.username);
        if (!staff) {
            return next(new ApiError(404, "Không tìm thấy tài khoản nhân viên"));
        }

        const passwordIsMatch = await bcrypt.compare(req.body.password, staff.password);
        if (!passwordIsMatch) {
            return next(new ApiError(401, "Mật khẩu không chính xác"));
        }

        // Kiểm tra tài khoản nhân viên có bị khóa/ngừng hoạt động không
        if (staff.status && staff.status !== "ACTIVE") {
            return next(new ApiError(403, "Tài khoản nhân viên của bạn đã bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ quản trị viên."));
        }

        const role = (staff.role || "STAFF").toUpperCase();

        const token = jwt.sign(
            { id: staff._id, username: staff.username, role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).send({
            token,
            staff: {
                id: staff._id,
                username: staff.username,
                role
            }
        });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "Lỗi xảy ra khi đăng nhập tài khoản nhân viên"));
    }
}

export default {
    create, findAll, findOne, update, deleteOne, deleteAll, login,
};
