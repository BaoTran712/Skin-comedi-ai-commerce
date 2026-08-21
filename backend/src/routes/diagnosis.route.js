import express from "express";
import auth from "../middlewares/auth.middleware.js";
import diagnosisController from "../controllers/diagnosis.controller.js";

const router = express.Router();

router.route("/my-history")
    .get(auth, diagnosisController.getMyHistory);

router.route("/my-latest")
    .get(auth, diagnosisController.getMyLatest);

router.route("/")
    .post(auth, diagnosisController.create);

router.route("/history/:userId")
    .get(diagnosisController.getHistory);

router.route("/latest/:userId")
    .get(diagnosisController.getLatest);

export default router;
