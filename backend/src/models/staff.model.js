import mongoose from "mongoose";

const staffSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    position_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Position",
    },
    hire_date: {
        type: Date,
        default: Date.now,
    },
    end_date: {
        type: Date,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "LOCKED"],
        default: "ACTIVE",
    },
    rank: {
        type: String,
        enum: ["intern", "junior", "senior", "manager"],
        default: "junior",
    },
    role: {
        type: String,
        enum: ["ADMIN", "STAFF", "CUSTOMER"],
        default: "STAFF",
    },
},
    {
        timestamps: true,
    }
);

const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
