import ApiError from "./src/api-error.js";
import express from "express";
import cors from "cors";

import staffRouter from "./src/routes/staff.route.js";
import userRouter from "./src/routes/user.route.js";
import publisherRouter from "./src/routes/brand.route.js";
import bookRouter from "./src/routes/product.route.js";
import borrowRouter from "./src/routes/order.route.js";
import reviewRouter from "./src/routes/review.route.js";
import diagnosisRouter from "./src/routes/diagnosis.route.js";
import chatRouter from "./src/routes/chat.route.js";
import authRouter from "./src/routes/auth.route.js";
import paymentRouter from "./src/routes/payment.route.js";
import postRouter from "./src/routes/post.route.js";
import supplierRouter from "./src/routes/supplier.route.js";
import importReceiptRouter from "./src/routes/importReceipt.route.js";
import promotionRouter from "./src/routes/promotion.route.js";
import settingRouter from "./src/routes/setting.route.js";
import variantRouter from "./src/routes/variant.route.js";
import addressRouter from "./src/routes/address.route.js";
import passport from "./src/config/passport.js";
import adminStatsRouter from "./src/routes/adminStats.route.js";
import adminRevenueRouter from "./src/routes/adminRevenue.route.js";
import aiRouter from "./src/routes/ai.route.js";
import notificationRouter from "./src/routes/notification.route.js";
import shippingRouter from "./src/routes/shipping.route.js";
import wishlistRouter from "./src/routes/wishlist.route.js";
import contactRouter from "./src/routes/contact.route.js";
import recommendationRouter from "./src/routes/recommendation.routes.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Testskin" });
});

app.use("/api/staff", staffRouter);
app.use("/api/user", userRouter);
app.use("/api/brand", publisherRouter);
app.use("/api/product", bookRouter);
app.use("/api/order", borrowRouter);
app.use("/api/review", reviewRouter);
app.use("/api/diagnosis", diagnosisRouter);
app.use("/api/chat", chatRouter);
app.use("/api/auth", authRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/post", postRouter);
app.use("/api/supplier", supplierRouter);
app.use("/api/import-receipt", importReceiptRouter);
app.use("/api/promotion", promotionRouter);
app.use("/api/setting", settingRouter);
app.use("/api/admin", adminStatsRouter);
app.use("/api/admin/revenue", adminRevenueRouter);
app.use("/api/address", addressRouter);
app.use("/api/ai", aiRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/contact", contactRouter);
app.use("/api/recommendations", recommendationRouter);
// Xử lý route không tồn tại
app.use((req, res, next) => {
    return next(new ApiError(404, "Resource not found"));
});

// Xử lý lỗi toàn cục
app.use((error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        message: error.message || "Internal Server Error",
    });
});

export default app;
