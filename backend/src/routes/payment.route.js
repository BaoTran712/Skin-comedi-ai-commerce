import express from "express";
import PaymentController from "../controllers/payment.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/vnpay-create", auth, PaymentController.createVnpayUrl);
router.get("/vnpay-return", PaymentController.vnpayReturn);

export default router;
