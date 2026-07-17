import express from "express";
import promotionController from "../controllers/promotion.controller.js";

const router = express.Router();

router.route("/")
    .post(promotionController.createPromotion)
    .get(promotionController.getPromotions);

router.route("/:id")
    .get(promotionController.getPromotionById)
    .put(promotionController.updatePromotion)
    .delete(promotionController.deletePromotion);

export default router;
