import mongoose from "mongoose";

const positionSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
    },
    permissions: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }
}, { timestamps: true });

const Position = mongoose.model("Position", positionSchema);
export default Position;
