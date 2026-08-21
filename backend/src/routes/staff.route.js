import express from "express";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import StaffController from "../controllers/staff.controller.js";

const router = express.Router();

router.route("/login").post(StaffController.login);

router.route("/")
    .post(auth, authorize("ADMIN"), StaffController.create)
    .get(auth, authorize("ADMIN"), StaffController.findAll)
    .delete(auth, authorize("ADMIN"), StaffController.deleteAll);

router.route("/:id")
    .put(auth, authorize("ADMIN", "STAFF"), StaffController.update)
    .get(auth, authorize("ADMIN", "STAFF"), StaffController.findOne)
    .delete(auth, authorize("ADMIN"), StaffController.deleteOne);

export default router;
