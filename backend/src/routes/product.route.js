import express from "express";
import auth from "../middlewares/auth.middleware.js";
import BookController from "../controllers/product.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.route("/")
    .post(BookController.create)
    .get(BookController.findAll)
    .delete(auth, BookController.deleteAll);

router.route("/:id")
    .get(BookController.findOne)
    .put(auth, BookController.update)
    .delete(auth, BookController.deleteOne);

router.post("/:id/upload", auth, upload.single("image"), BookController.uploadImage);

export default router;
