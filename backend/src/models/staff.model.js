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
        required: true,
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
        required: true,
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
        enum: ["active", "inactive"],
        default: "active",
    },
    rank: {
        type: String,
        enum: ["intern", "junior", "senior", "manager"],
        default: "junior",
    },
},
    {
        timestamps: true,
    }
);

const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
