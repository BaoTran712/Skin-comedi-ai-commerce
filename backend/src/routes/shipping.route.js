import express from "express";
import { getMethods } from "../controllers/shipping.controller.js";

const router = express.Router();

router.get("/methods", getMethods);

export default router;
