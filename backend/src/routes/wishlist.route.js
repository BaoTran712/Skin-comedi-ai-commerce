import express from "express";
import auth from "../middlewares/auth.middleware.js";
import wishlistController from "../controllers/wishlist.controller.js";

const router = express.Router();

router.route("/")
    .get(auth, wishlistController.getWishlist);

router.route("/:productId")
    .post(auth, wishlistController.addProduct)
    .delete(auth, wishlistController.removeProduct);

export default router;
