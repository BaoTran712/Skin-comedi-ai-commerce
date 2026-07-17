import express from "express";
import importReceiptController from "../controllers/importReceipt.controller.js";

const router = express.Router();

router.route("/")
    .post(importReceiptController.createImportReceipt)
    .get(importReceiptController.getImportReceipts);

router.route("/:id")
    .get(importReceiptController.getImportReceiptById);

export default router;
