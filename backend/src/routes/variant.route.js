import express from "express";
import * as variantController from "../controllers/variant.controller.js";
import passport from "passport";

const router = express.Router();

router.get("/product/:productId", variantController.getVariantsByProductId);

// Protected routes
router.post("/", passport.authenticate("jwt", { session: false }), variantController.createVariant);
router.put("/:id", passport.authenticate("jwt", { session: false }), variantController.updateVariant);
router.delete("/:id", passport.authenticate("jwt", { session: false }), variantController.deleteVariant);

export default router;
