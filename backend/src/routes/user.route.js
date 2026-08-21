import express from "express";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import UserController from "../controllers/user.controller.js";

const router = express.Router();

router.post("/login", UserController.login);
router.post("/register", UserController.create);
router.post("/verify-otp", UserController.verifyOTP);
router.post("/resend-otp", UserController.resendOTP);

router.get("/profile/skin", auth, UserController.getSkinProfile);
router.put("/profile/skin", auth, UserController.updateSkinProfile);

// Bank Accounts Routes
router.get("/banks", auth, UserController.getBankAccounts);
router.post("/banks", auth, UserController.addBankAccount);
router.put("/banks/:id", auth, UserController.updateBankAccount);
router.delete("/banks/:id", auth, UserController.deleteBankAccount);
router.patch("/banks/:id/default", auth, UserController.setDefaultBankAccount);

// Points Routes
router.get("/points", auth, UserController.getUserPoints);
router.get("/points/history", auth, UserController.getPointHistory);
router.post("/points/adjust", auth, authorize("ADMIN"), UserController.adjustCustomerPoints);

router.route("/")
    .post(UserController.create)
    .get(auth, authorize("ADMIN", "STAFF"), UserController.findAll)
    .delete(auth, authorize("ADMIN"), UserController.deleteAll);

router.route("/:id")
    .put(auth, UserController.update)
    .get(auth, UserController.findOne)
    .delete(auth, authorize("ADMIN"), UserController.deleteOne);

export default router;
