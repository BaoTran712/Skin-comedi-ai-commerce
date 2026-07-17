import express from "express";
import postController from "../controllers/post.controller.js";

const router = express.Router();

router.route("/")
    .post(postController.createPost)
    .get(postController.getPosts);

router.route("/:id")
    .get(postController.getPostById)
    .put(postController.updatePost)
    .delete(postController.deletePost);

export default router;
