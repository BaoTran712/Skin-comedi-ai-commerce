import express from "express";
import { recommendProducts } from "../controllers/recommendation.controller.js";

const router = express.Router();

// POST /api/recommendations/predict
router.post("/predict", recommendProducts);

export default router;
