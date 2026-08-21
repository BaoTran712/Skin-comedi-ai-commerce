import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true,
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    password: {
        type: String,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
    },
    otp_expiry: {
        type: Date,
    },
    birthday: {
        type: Date,
    },
    gender: {
        type: Boolean,
    },
    addresses: [{
        label: { type: String, trim: true }, // optional nickname
        recipientName: { type: String, trim: true },
        provinceCode: { type: String, required: true },
        provinceName: { type: String, required: true },
        districtCode: { type: String, required: true },
        districtName: { type: String, required: true },
        wardCode: { type: String, required: true },
        wardName: { type: String, required: true },
        addressDetail: { type: String, required: true, trim: true },
        phone: { type: String, required: true, match: /^0[0-9]{9}$/ },
        isDefault: { type: Boolean, default: false }
    }],
    role: {
        type: String,
        enum: ["ADMIN", "STAFF", "CUSTOMER"],
        default: "CUSTOMER",
    },
    oauth_provider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    oauth_id: {
        type: String,
    },
    email: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String,
    },
    points: {
        type: Number,
        default: 0,
    },
    rank: {
        type: String,
        enum: ["bronze", "silver", "gold", "diamond"],
        default: "bronze",
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "LOCKED"],
        default: "ACTIVE",
    },
    skin_profile: {
        skin_type: { type: String, default: "" },
        conditions: { type: [String], default: [] },
        current_products: { type: [String], default: [] },
        notes: { type: String, default: "" }
    },
    bank_accounts: [{
        bank_name: { type: String, required: true, trim: true },
        account_name: { type: String, required: true, trim: true },
        account_number: { type: String, required: true, trim: true },
        isDefault: { type: Boolean, default: false }
    }]
},
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);
export default User;
