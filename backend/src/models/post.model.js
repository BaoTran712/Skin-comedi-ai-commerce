import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    author_id: {
        type: mongoose.Schema.ObjectId,
        ref: "Staff",
    },
    status: {
        type: String,
        enum: ["draft", "published"],
        default: "published",
    }
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);
export default Post;
