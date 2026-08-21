import ApiError from "../api-error.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Staff from "../models/staff.model.js";

dotenv.config();

export async function auth(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return next(new ApiError(401, "Token không hợp lệ hoặc thiếu thông tin đăng nhập"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Normalize role in decoded user object
        let role = (decoded.role || "CUSTOMER").toString().trim().toUpperCase();
        if (role === "USER") role = "CUSTOMER";
        if (role === "EMPLOYEE") role = "STAFF";
        
        decoded.role = role;
        req.user = decoded;
        req.userId = decoded.id || decoded._id || decoded.userId;

        // Kiểm tra trạng thái và vai trò của tài khoản trực tiếp trong Database
        const dbUser = await User.findById(req.userId).select("status role");
        if (!dbUser) {
            const dbStaff = await Staff.findById(req.userId).select("status role");
            if (!dbStaff) {
                return next(new ApiError(401, "Tài khoản không tồn tại hoặc đã bị xóa"));
            }
            if (dbStaff.status && dbStaff.status.toUpperCase() !== "ACTIVE") {
                return next(new ApiError(403, "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động"));
            }
            req.user.role = (dbStaff.role || "STAFF").toUpperCase();
        } else {
            if (dbUser.status && dbUser.status.toUpperCase() !== "ACTIVE") {
                return next(new ApiError(403, "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động"));
            }
            req.user.role = (dbUser.role || "CUSTOMER").toUpperCase();
        }

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            console.error("Token expired");
            return next(new ApiError(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."));
        }
        return next(new ApiError(401, "Token không hợp lệ"));
    }
}

export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return next(new ApiError(401, "Người dùng chưa được xác thực"));
        }

        let userRole = req.user.role.toString().trim().toUpperCase();
        if (userRole === "USER") userRole = "CUSTOMER";
        if (userRole === "EMPLOYEE") userRole = "STAFF";

        const upperAllowedRoles = allowedRoles.map(r => r.toUpperCase());

        if (!upperAllowedRoles.includes(userRole)) {
            return next(new ApiError(403, "Bạn không có quyền truy cập tính năng này"));
        }

        next();
    };
}

export default auth;
