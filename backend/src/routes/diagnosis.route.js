import express from "express";
import diagnosisController from "../controllers/diagnosis.controller.js";

const router = express.Router();

router.route("/")
    .post(diagnosisController.create);

router.route("/history/:userId")
    .get(diagnosisController.getHistory);

router.route("/latest/:userId")
    .get(diagnosisController.getLatest);

export default router;
