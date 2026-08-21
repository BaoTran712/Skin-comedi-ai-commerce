import UserService from "../services/user.service.js";
import ApiError from "../api-error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import emailService from "../services/email.service.js";
import User from "../models/user.model.js";
import PointTransaction from "../models/pointTransaction.model.js";

const userService = new UserService();
dotenv.config();

export async function create(req, res, next) {
    const { username, password, first_name, last_name, phone } = req.body;
    
    if (!username || !password || !first_name || !last_name) {
        return next(new ApiError(400, "Các trường email (username), mật khẩu, họ lót và tên là bắt buộc"));
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,32}$/;
    if (!passwordRegex.test(password)) {
        return next(new ApiError(400, "Mật khẩu phải từ 8 đến 32 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (@, #, $, !, %, *...)"));
    }

    try {
        const existingUser = await userService.findByUsername(username);
        if (existingUser) {
            return next(new ApiError(409, "Email/Username đã tồn tại"));
        }

        if (phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return next(new ApiError(409, "Số điện thoại đã được đăng ký"));
            }
        }

        req.body.isVerified = true;
        req.body.email = username; // Yêu cầu username chính là email
        req.body.role = "CUSTOMER"; // Enforce customer role strictly

        await userService.create(req.body);

        // Send greeting welcome email directly
        await emailService.sendWelcomeEmail(username, first_name);

        return res.status(201).json({ 
            success: true, 
            message: "Đăng ký tài khoản thành công! Bây giờ bạn có thể đăng nhập." 
        });
    } catch (error) {
        console.error("User Create Error:", error);
        if (error.name === 'ValidationError') {
            return next(new ApiError(422, error.message));
        }
        return next(new ApiError(500, "Lỗi server khi tạo tài khoản"));
    }
}

export async function findAll(req, res, next) {
    let documents = [];
    try {
        const { name } = req.query;
        if (name) {
            documents = await userService.findByName(name);
        } else {
            documents = await userService.find({});
        }
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "An error occurred while retrieving the list of user records"));
    }
    return res.json(documents);
}

export async function findOne(req, res, next) {
    const requesterId = req.user?.id;
    const requesterRole = (req.user?.role || "").toUpperCase();
    const targetId = req.params.id;

    // Chỉ Admin, Staff hoặc chính người dùng sở hữu tài khoản mới có quyền xem thông tin
    if (requesterRole !== "ADMIN" && requesterRole !== "STAFF" && requesterId !== targetId) {
        return next(new ApiError(403, "Bạn không có quyền truy cập thông tin tài khoản này"));
    }

    try {
        const document = await userService.findById(targetId);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy tài khoản người dùng"));
        }
        
        // Ẩn mật khẩu khi phản hồi
        const userObj = document.toObject ? document.toObject() : { ...document };
        delete userObj.password;

        return res.json(userObj);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Lỗi khi lấy thông tin người dùng id ${targetId}`));
    }
}

export async function update(req, res, next) {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Dữ liệu cập nhật không được trống"));
    }

    const requesterId = req.user?.id;
    const requesterRole = (req.user?.role || "").toUpperCase();
    const targetId = req.params.id;

    // 1. Phân quyền: Người dùng thường chỉ được sửa tài khoản của chính mình. Admin được sửa tất cả.
    if (requesterRole !== "ADMIN" && requesterId !== targetId) {
        return next(new ApiError(403, "Bạn không có quyền chỉnh sửa tài khoản này"));
    }

    // 2. Trường thông tin nhạy cảm: Chỉ ADMIN mới được thay đổi role hoặc status
    if (req.body.role || req.body.status) {
        if (requesterRole !== "ADMIN") {
            return next(new ApiError(403, "Chỉ ADMIN mới có quyền thay đổi vai trò hoặc khóa/mở khóa người dùng"));
        }

        // Cơ chế bảo vệ Admin khác (không cho Admin này hạ quyền hoặc khóa Admin khác)
        if (req.body.role && req.body.role !== "ADMIN") {
            const targetUser = await User.findById(targetId);
            if (targetUser && targetUser.role === "ADMIN" && targetId !== requesterId) {
                return next(new ApiError(403, "Không thể hạ quyền của quản trị viên khác"));
            }
        }
        if (req.body.status && req.body.status !== "ACTIVE") {
            const targetUser = await User.findById(targetId);
            if (targetUser && targetUser.role === "ADMIN" && targetId !== requesterId) {
                return next(new ApiError(403, "Không thể khóa tài khoản của quản trị viên khác"));
            }
        }

        if (req.body.role) {
            req.body.role = req.body.role.toUpperCase();
        }
    }

    // 3. Xử lý đổi mật khẩu an toàn
    if (req.body.password !== undefined) {
        const newPassword = req.body.password;
        if (!newPassword || newPassword.trim() === "") {
            return next(new ApiError(400, "Mật khẩu mới không được để trống"));
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,32}$/;
        if (!passwordRegex.test(newPassword)) {
            return next(new ApiError(400, "Mật khẩu mới phải từ 8 đến 32 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (@, #, $, !, %, *...)"));
        }

        // Nếu chính User đang đổi mật khẩu của mình, bắt buộc phải cung cấp và xác minh mật khẩu hiện tại
        if (requesterId === targetId) {
            const { currentPassword } = req.body;
            if (!currentPassword) {
                return next(new ApiError(400, "Vui lòng cung cấp mật khẩu hiện tại để đổi mật khẩu"));
            }

            const userInDb = await User.findById(targetId);
            if (!userInDb || !userInDb.password) {
                return next(new ApiError(404, "Không tìm thấy thông tin người dùng"));
            }

            const isMatch = await bcrypt.compare(currentPassword, userInDb.password);
            if (!isMatch) {
                return next(new ApiError(400, "Mật khẩu hiện tại không chính xác"));
            }

            const isSameAsOld = await bcrypt.compare(newPassword, userInDb.password);
            if (isSameAsOld) {
                return next(new ApiError(400, "Mật khẩu mới không được trùng với mật khẩu cũ"));
            }
        } else {
            // Trường hợp Admin đổi mật khẩu cho người khác, bảo vệ không cho đổi mật khẩu Admin khác
            const targetUser = await User.findById(targetId);
            if (targetUser && targetUser.role === "ADMIN") {
                return next(new ApiError(403, "Không thể đổi mật khẩu của quản trị viên khác"));
            }
        }

        // Xóa trường mật khẩu hiện tại khỏi body để tránh lưu trữ
        delete req.body.currentPassword;
    }

    try {
        if (req.body.username) {
            const existingUser = await userService.findByUsername(req.body.username);
            if (existingUser && existingUser._id.toString() !== targetId) {
                return next(new ApiError(409, "Username/Email đã được sử dụng"));
            }
        }
        const document = await userService.update(targetId, req.body);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy người dùng"));
        }

        // Ẩn mật khẩu khi phản hồi
        const userObj = document.toObject ? document.toObject() : { ...document };
        delete userObj.password;

        return res.json({ message: "Cập nhật người dùng thành công", document: userObj });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Lỗi khi cập nhật người dùng id ${targetId}`));
    }
}

export async function deleteOne(req, res, next) {
    try {
        const document = await userService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "User record not found"));
        }
        return res.send({ message: "User record deleted successfully" });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Could not delete user record with id ${req.params.id}`));
    }
}

export async function deleteAll(req, res, next) {
    try {
        const deleteCount = await userService.deleteAll();
        return res.send({
            message: `${deleteCount} user records were deleted successfully`,
        });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "An error occurred while deleting all user records"));
    }
}

export async function login(req, res, next) {
    if (!req.body?.username || !req.body?.password) {
        return next(new ApiError(400, "Username hoặc mật khẩu không được trống"));
    }
    try {
        const user = await userService.findByUsername(req.body.username);
        if (!user) {
            return next(new ApiError(404, "Không tìm thấy tài khoản"));
        }

        const passwordIsMatch = await bcrypt.compare(req.body.password, user.password);
        if (!passwordIsMatch) {
            return next(new ApiError(401, "Mật khẩu không chính xác"));
        }

        // Kiểm tra tài khoản có bị khóa/ngừng hoạt động không
        if (user.status && user.status !== "ACTIVE") {
            return next(new ApiError(403, "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ quản trị viên."));
        }

        // Auto-verify user if password is correct (handles seeded / legacy accounts)
        if (user.isVerified === false) {
            user.isVerified = true;
            await user.save();
        }

        let normalizedRole = (user.role || "CUSTOMER").toString().trim().toUpperCase();
        if (normalizedRole === "USER") normalizedRole = "CUSTOMER";
        if (normalizedRole === "EMPLOYEE") normalizedRole = "STAFF";

        const token = jwt.sign(
            { id: user._id, username: user.username, role: normalizedRole },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).send({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: normalizedRole,
                first_name: user.first_name,
                last_name: user.last_name,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "Lỗi xảy ra khi đăng nhập"));
    }
}

export async function verifyOTP(req, res, next) {
    const { username, otp } = req.body;
    if (!username || !otp) {
        return next(new ApiError(400, "Vui lòng nhập Email và mã OTP"));
    }

    try {
        const user = await userService.findByUsername(username);
        if (!user) {
            return next(new ApiError(404, "Không tìm thấy tài khoản"));
        }

        if (user.isVerified) {
            return res.json({ success: true, message: "Tài khoản đã được xác thực trước đó" });
        }

        if (new Date() > new Date(user.otp_expiry)) {
            return next(new ApiError(400, "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã."));
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return next(new ApiError(400, "Mã OTP không chính xác"));
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otp_expiry = undefined;
        await user.save();

        // Send greeting welcome email
        await emailService.sendWelcomeEmail(user.username, user.first_name);

        return res.json({ success: true, message: "Xác thực tài khoản thành công! Bây giờ bạn có thể đăng nhập." });
    } catch (error) {
        console.error("verifyOTP Error:", error);
        return next(new ApiError(500, "Lỗi server khi xác thực OTP"));
    }
}

export async function resendOTP(req, res, next) {
    const { username } = req.body;
    if (!username) {
        return next(new ApiError(400, "Vui lòng điền Email"));
    }

    try {
        const user = await userService.findByUsername(username);
        if (!user) {
            return next(new ApiError(404, "Không tìm thấy tài khoản"));
        }

        if (user.isVerified) {
            return next(new ApiError(400, "Tài khoản đã được xác thực rồi"));
        }

        // Tạo OTP mới
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 12);
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

        user.otp = hashedOtp;
        user.otp_expiry = otpExpiry;
        await user.save();

        // Gửi OTP
        await emailService.sendOTPEmail(username, otp, user.first_name);

        return res.json({ success: true, message: "Gửi lại mã OTP thành công. Vui lòng check hòm thư." });
    } catch (error) {
        console.error("resendOTP Error:", error);
        return next(new ApiError(500, "Lỗi server khi gửi lại OTP"));
    }
}

export async function getSkinProfile(req, res, next) {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return next(new ApiError(404, "Không tìm thấy người dùng"));
        }
        return res.json(user.skin_profile || { skin_type: "", conditions: [], current_products: [], notes: "" });
    } catch (error) {
        console.error("getSkinProfile Error:", error);
        return next(new ApiError(500, "Lỗi server khi lấy hồ sơ da"));
    }
}

export async function updateSkinProfile(req, res, next) {
    try {
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: { skin_profile: req.body } },
            { new: true, runValidators: true }
        );
        if (!user) {
            return next(new ApiError(404, "Không tìm thấy người dùng"));
        }
        return res.json(user.skin_profile);
    } catch (error) {
        console.error("updateSkinProfile Error:", error);
        return next(new ApiError(550, "Lỗi server khi cập nhật hồ sơ da"));
    }
}

// Helper function to mask bank account numbers for security
function maskAccountNumber(accNo) {
    if (!accNo) return "****";
    const str = String(accNo).trim();
    if (str.length <= 4) return str;
    return "********" + str.slice(-4);
}

// === BANK ACCOUNTS CONTROLLERS ===
export async function getBankAccounts(req, res, next) {
    try {
        const user = await User.findById(req.userId || req.user?.id);
        if (!user) return next(new ApiError(404, "Không tìm thấy người dùng"));
        
        const accounts = (user.bank_accounts || []).map(b => ({
            _id: b._id,
            bank_name: b.bank_name,
            account_name: b.account_name,
            account_number_masked: maskAccountNumber(b.account_number),
            account_number_raw: b.account_number,
            isDefault: b.isDefault
        }));
        return res.json(accounts);
    } catch (error) {
        return next(new ApiError(500, "Lỗi khi lấy danh sách tài khoản ngân hàng"));
    }
}

export async function addBankAccount(req, res, next) {
    try {
        const { bank_name, account_name, account_number, isDefault } = req.body;
        if (!bank_name || !account_name || !account_number) {
            return next(new ApiError(400, "Vui lòng nhập Tên ngân hàng, Tên chủ tài khoản và Số tài khoản"));
        }

        const user = await User.findById(req.userId || req.user?.id);
        if (!user) return next(new ApiError(404, "Không tìm thấy người dùng"));

        if (!user.bank_accounts) user.bank_accounts = [];

        const isFirst = user.bank_accounts.length === 0;
        const setDef = isDefault || isFirst;

        if (setDef) {
            user.bank_accounts.forEach(b => b.isDefault = false);
        }

        user.bank_accounts.push({
            bank_name: bank_name.trim(),
            account_name: account_name.trim().toUpperCase(),
            account_number: account_number.trim(),
            isDefault: setDef
        });

        await user.save();
        return res.status(201).json({ success: true, message: "Thêm tài khoản ngân hàng thành công", bank_accounts: user.bank_accounts });
    } catch (error) {
        return next(new ApiError(500, "Lỗi server khi thêm tài khoản ngân hàng"));
    }
}

export async function updateBankAccount(req, res, next) {
    try {
        const { bank_name, account_name, account_number, isDefault } = req.body;
        const user = await User.findById(req.userId || req.user?.id);
        if (!user) return next(new ApiError(404, "Không tìm thấy người dùng"));

        const bank = user.bank_accounts.id(req.params.id);
        if (!bank) return next(new ApiError(404, "Không tìm thấy tài khoản ngân hàng"));

        if (bank_name) bank.bank_name = bank_name.trim();
        if (account_name) bank.account_name = account_name.trim().toUpperCase();
        if (account_number) bank.account_number = account_number.trim();

        if (isDefault) {
            user.bank_accounts.forEach(b => b.isDefault = false);
            bank.isDefault = true;
        }

        await user.save();
        return res.json({ success: true, message: "Cập nhật tài khoản ngân hàng thành công", bank_accounts: user.bank_accounts });
    } catch (error) {
        return next(new ApiError(500, "Lỗi server khi cập nhật tài khoản ngân hàng"));
    }
}

export async function deleteBankAccount(req, res, next) {
    try {
        const user = await User.findById(req.userId || req.user?.id);
        if (!user) return next(new ApiError(404, "Không tìm thấy người dùng"));

        user.bank_accounts = user.bank_accounts.filter(b => b._id.toString() !== req.params.id);
        if (user.bank_accounts.length > 0 && !user.bank_accounts.some(b => b.isDefault)) {
            user.bank_accounts[0].isDefault = true;
        }
        await user.save();
        return res.json({ success: true, message: "Xóa tài khoản ngân hàng thành công", bank_accounts: user.bank_accounts });
    } catch (error) {
        return next(new ApiError(500, "Lỗi server khi xóa tài khoản ngân hàng"));
    }
}

export async function setDefaultBankAccount(req, res, next) {
    try {
        const user = await User.findById(req.userId || req.user?.id);
        if (!user) return next(new ApiError(404, "Không tìm thấy người dùng"));

        user.bank_accounts.forEach(b => {
            b.isDefault = (b._id.toString() === req.params.id);
        });
        await user.save();
        return res.json({ success: true, message: "Đặt tài khoản ngân hàng mặc định thành công", bank_accounts: user.bank_accounts });
    } catch (error) {
        return next(new ApiError(500, "Lỗi server khi đặt ngân hàng mặc định"));
    }
}

// === POINTS & HISTORY CONTROLLERS ===
export async function getUserPoints(req, res, next) {
    try {
        const user = await User.findById(req.userId || req.user?.id);
        if (!user) return next(new ApiError(404, "Không tìm thấy người dùng"));

        const history = await PointTransaction.find({ user_id: user._id });
        const totalEarned = history.filter(h => h.type === "EARN" || (h.type === "ADJUST" && h.amount > 0)).reduce((sum, h) => sum + h.amount, 0);
        const totalSpent = history.filter(h => h.type === "SPEND" || (h.type === "ADJUST" && h.amount < 0)).reduce((sum, h) => sum + Math.abs(h.amount), 0);

        return res.json({
            points: user.points || 0,
            rank: user.rank || "bronze",
            totalEarned,
            totalSpent
        });
    } catch (error) {
        return next(new ApiError(500, "Lỗi server khi lấy điểm tích lũy"));
    }
}

export async function getPointHistory(req, res, next) {
    try {
        const userId = req.userId || req.user?.id;
        const history = await PointTransaction.find({ user_id: userId }).sort({ createdAt: -1 });
        return res.json(history);
    } catch (error) {
        return next(new ApiError(500, "Lỗi server khi lấy lịch sử tích điểm"));
    }
}

// === ADMIN POINTS ADJUSTMENT CONTROLLER ===
export async function adjustCustomerPoints(req, res, next) {
    try {
        const { user_id, type, amount, reason } = req.body;
        if (!user_id || !type || amount === undefined || !reason || !reason.trim()) {
            return next(new ApiError(400, "Vui lòng nhập đầy đủ thông tin: ID khách hàng, loại điều chỉnh (+/-), số điểm và Lý do điều chỉnh"));
        }

        const targetUser = await User.findById(user_id);
        if (!targetUser) return next(new ApiError(404, "Không tìm thấy khách hàng"));

        const pointChange = Number(amount);
        if (isNaN(pointChange) || pointChange === 0) {
            return next(new ApiError(400, "Số điểm điều chỉnh phải khác 0"));
        }

        targetUser.points = Math.max(0, (targetUser.points || 0) + pointChange);
        await targetUser.save();

        const log = new PointTransaction({
            user_id: targetUser._id,
            type: pointChange > 0 ? "EARN" : "SPEND",
            amount: pointChange,
            balance_after: targetUser.points,
            description: `Admin điều chỉnh: ${reason.trim()}`,
            adjusted_by: req.user.id || req.userId,
            reason: reason.trim()
        });
        await log.save();

        return res.json({ success: true, message: `Đã điều chỉnh điểm thành công cho ${targetUser.username}`, user: targetUser, log });
    } catch (error) {
        return next(new ApiError(500, "Lỗi server khi điều chỉnh điểm khách hàng"));
    }
}

export default {
    create, findAll, findOne, update, deleteOne, deleteAll, login, verifyOTP, resendOTP, getSkinProfile, updateSkinProfile,
    getBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, setDefaultBankAccount,
    getUserPoints, getPointHistory, adjustCustomerPoints
};
