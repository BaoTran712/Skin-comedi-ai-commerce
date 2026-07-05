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
    birthday: {
        type: Date,
    },
    gender: {
        type: Boolean,
    },
    addresses: [{
        label: { type: String, trim: true }, // optional nickname
        address: { type: String, required: true, trim: true },
        phone: { type: String, required: true, match: /^0[0-9]{9}$/ },
        isDefault: { type: Boolean, default: false }
    }],
    role: {
        type: String,
        default: "user",
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
    }
},
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);
export default User;
