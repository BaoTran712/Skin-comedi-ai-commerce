import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
    {
        khoa_cau_hinh: {
            type: String,
            required: true,
            unique: true,
        },
        gia_tri: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        mo_ta: {
            type: String,
        },
    },
    { timestamps: true }
);

// Map _id to id
settingSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
