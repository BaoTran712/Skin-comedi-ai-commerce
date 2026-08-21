import User from "../models/user.model.js";
import bcrypt from "bcrypt";

class UserService {
    async create(payload) {
        const userData = {
            username: payload.username,
            first_name: payload.first_name || undefined,
            last_name: payload.last_name || undefined,
            email: payload.email || undefined,
            phone: payload.phone || undefined,
            password: payload.password,
            role: (payload.role || "CUSTOMER").toUpperCase(),
            birthday: payload.birthday || undefined,
            gender: payload.gender,
            isVerified: payload.isVerified || false,
            otp: payload.otp || undefined,
            otp_expiry: payload.otp_expiry || undefined,
        };

        // Insert structured address only if province and district codes are provided
        if (payload.selectedProvince && payload.selectedDistrict) {
            userData.addresses = [{
                label: "Nhà riêng",
                recipientName: `${payload.first_name || ""} ${payload.last_name || ""}`.trim() || "Người nhận",
                provinceCode: payload.selectedProvince.toString(),
                provinceName: payload.address.split(", ")[1] || "Tỉnh/Thành",
                districtCode: payload.selectedDistrict.toString(),
                districtName: payload.address.split(", ")[0] || "Quận/Huyện",
                wardCode: "00000", // Default fallback code to pass model schema requirements
                wardName: "Chưa chọn Phường/Xã",
                addressDetail: "Chưa cập nhật số nhà",
                phone: payload.phone || "0000000000",
                isDefault: true
            }];
        }

        Object.keys(userData).forEach(key => {
            if (userData[key] === undefined || userData[key] === null || userData[key] === "") {
                delete userData[key];
            }
        });

        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 12);
        }

        const user = new User(userData);
        return await user.save();
    }

    async find(filter) {
        return await User.find(filter);
    }

    async findById(id) {
        return await User.findById(id);
    }

    async findByName(name) {
        return await User.find({
            name: { $regex: new RegExp(name, "i") },
        });
    }

    async findByUsername(identifier) {
        if (!identifier) return null;
        return await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier },
                { phone: identifier }
            ]
        });
    }

    async update(id, payload) {
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 12);
        } else {
            delete payload.password;
        }

        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === "" || payload[key] === null) {
                delete payload[key];
            }
        });

        const result = await User.findByIdAndUpdate(
            id, { $set: payload }, { new: true }
        );

        if (!result) {
            throw new Error("User not found");
        }

        return result;
    }

    async delete(id) {
        const result = await User.findByIdAndDelete(id);

        if (!result) {
            throw new Error(`User with ID ${id} not found`);
        }
        return result;
    }

    async deleteAll() {
        const result = await User.deleteMany({});
        return result.deletedCount;
    }
}

export default UserService;
