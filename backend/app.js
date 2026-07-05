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
import passport from "./src/config/passport.js";
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
