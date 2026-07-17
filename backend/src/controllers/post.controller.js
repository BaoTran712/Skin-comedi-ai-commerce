import Post from "../models/post.model.js";

const createPost = async (req, res) => {
    try {
        const post = new Post(req.body);
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi tạo bài viết" });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate("author_id", "name username").sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách bài viết" });
    }
};

const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("author_id", "name username");
        if (!post) {
            return res.status(404).json({ error: "Không tìm thấy bài viết" });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy chi tiết bài viết" });
    }
};

const updatePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!post) {
            return res.status(404).json({ error: "Không tìm thấy bài viết" });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi cập nhật bài viết" });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Không tìm thấy bài viết" });
        }
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa bài viết" });
    }
};

export default {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost
};
