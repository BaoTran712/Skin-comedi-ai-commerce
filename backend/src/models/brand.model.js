import mongoose from "mongoose";

const publisherSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
},
    {
        timestamps: true,
    }
);

const Brand = mongoose.model("Brand", publisherSchema);
export default Brand;
