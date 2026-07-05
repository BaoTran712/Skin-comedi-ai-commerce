import express from "express";
import reviewController from "../controllers/review.controller.js";

const router = express.Router();

router.route("/")
    .get(reviewController.findAll)
    .post(reviewController.create);

router.route("/user/:userId")
    .get(reviewController.findByUserId);

router.route("/product/:productId")
    .get(reviewController.findByProductId);

router.route("/:id")
    .get(reviewController.findOne)
    .put(reviewController.update)
    .delete(reviewController.deleteOne);

export default router;
