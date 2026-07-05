import express from "express";
import auth from "../middlewares/auth.middleware.js";
import OrderController from "../controllers/order.controller.js";

const router = express.Router();

router.route("/stats")
    .get(OrderController.getStats);

router.route("/")
    .post(OrderController.create)
    .get(auth, OrderController.findAll)
    .delete(auth, OrderController.deleteAll);

router.route("/:id")
    .get(auth, OrderController.findOne)
    .put(auth, OrderController.update)
    .delete(auth, OrderController.deleteOne);

export default router;
