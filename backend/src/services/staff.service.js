import Staff from "../models/staff.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

class StaffService {
    async create(payload) {
        const staffName = payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || payload.username;
        const staffData = {
            name: staffName,
            username: payload.username,
            password: payload.password,
            role: "STAFF",
            address: payload.address || "",
            phone: payload.phone || "",
            status: "ACTIVE"
        };

        if (staffData.password) {
            staffData.password = await bcrypt.hash(staffData.password, 12);
        }

        const staff = new Staff(staffData);
        const savedStaff = await staff.save();

        // Sync corresponding record in User collection for universal login
        try {
            const existingUser = await User.findOne({ username: payload.username });
            if (!existingUser) {
                const userDoc = new User({
                    first_name: payload.first_name || staffName.split(' ')[0] || "Nhân",
                    last_name: payload.last_name || staffName.split(' ').slice(1).join(' ') || "Viên",
                    username: payload.username,
                    email: payload.username,
                    password: staffData.password,
                    phone: payload.phone || undefined,
                    role: "STAFF",
                    isVerified: true,
                    status: "ACTIVE"
                });
                await userDoc.save();
            } else {
                existingUser.role = "STAFF";
                existingUser.password = staffData.password;
                existingUser.isVerified = true;
                await existingUser.save();
            }
        } catch (syncErr) {
            console.error("Sync staff to User collection error:", syncErr);
        }

        return savedStaff;
    }

    async find(filter) {
        return await Staff.find(filter).sort({ createdAt: -1 });
    }

    async findById(id) {
        return await Staff.findById(id);
    }

    async findByName(name) {
        return await Staff.find({
            name: { $regex: name, $options: "i" }
        });
    }

    async findByUsername(username) {
        return await Staff.findOne({ username });
    }

    async update(id, payload) {
        const existingStaff = await Staff.findById(id);
        if (!existingStaff) {
            throw new Error(`Staff with ID ${id} not found`);
        }

        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 12);
        } else {
            delete payload.password;
        }

        if (payload.role) {
            payload.role = payload.role.toUpperCase();
        }

        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === "" || payload[key] === null) {
                delete payload[key];
            }
        });

        const result = await Staff.findByIdAndUpdate(
            id, { $set: payload }, { new: true, runValidators: true }
        );

        // Also update corresponding User record
        try {
            if (existingStaff.username) {
                const userDoc = await User.findOne({ username: existingStaff.username });
                if (userDoc) {
                    if (payload.role) userDoc.role = payload.role;
                    if (payload.password) userDoc.password = payload.password;
                    if (payload.status) userDoc.status = payload.status;
                    await userDoc.save();
                }
            }
        } catch (syncErr) {
            console.error("Sync update staff error:", syncErr);
        }

        return result;
    }

    async delete(id) {
        const staff = await Staff.findById(id);
        if (staff) {
            await User.deleteOne({ username: staff.username });
        }
        const result = await Staff.findByIdAndDelete(id);
        return result;
    }

    async deleteAll() {
        const result = await Staff.deleteMany({});
        return result.deletedCount;
    }
}

export default StaffService;
