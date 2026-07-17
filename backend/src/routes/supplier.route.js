import express from "express";
import supplierController from "../controllers/supplier.controller.js";

const router = express.Router();

router.route("/")
    .post(supplierController.createSupplier)
    .get(supplierController.getSuppliers);

router.route("/:id")
    .get(supplierController.getSupplierById)
    .put(supplierController.updateSupplier)
    .delete(supplierController.deleteSupplier);

export default router;
