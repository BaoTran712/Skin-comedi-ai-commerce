import express from "express";
import PaymentController from "../controllers/payment.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();


// VNPAY endpoints (existing)
router.post("/vnpay-create", auth, PaymentController.createVnpayUrl);
router.get("/vnpay-return", PaymentController.vnpayReturn);
router.get("/vnpay-ipn", PaymentController.vnpayIpn);

// MOMO Sandbox endpoints
router.post("/momo-create", auth, PaymentController.createMomoUrl);
router.get("/momo-return", PaymentController.momoReturn);
router.post("/momo-return", PaymentController.momoReturn);
router.post("/momo-ipn", PaymentController.momoIpn);

// ── BANK TRANSFER / VIETQR endpoints ─────────────────────────
// Customer: mark "I have transferred" → sets payment to VERIFYING
router.post("/bank-transfer-request", auth, PaymentController.bankTransferRequest);

// Anyone (incl. unauthenticated polling): check payment status by orderId
router.get("/status/:orderId", auth, PaymentController.getPaymentStatus);

// ADMIN/STAFF: manually confirm that money was received → sets payment to PAID
router.post("/admin-confirm/:orderId", auth, PaymentController.adminConfirmPayment);

export default router;
