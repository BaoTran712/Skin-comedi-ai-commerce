import OrderService from "../services/order.service.js";
import ApiError from "../api-error.js";

const orderService = new OrderService();

export async function create(req, res, next) {
    if (!req.body?.user_id || !req.body?.product_id || !req.body?.addressId) {
        return next(new ApiError(400, "User, product, shipping address or phone number is missing"));
    }

    try {
        const document = await orderService.create(req.body);
        return res.status(201).json({ message: "Order created successfully", document });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "An error occurred while creating the order"));
    }
}

export async function findAll(req, res, next) {
    try {
        const filter = {};
        if (req.query.user_id) {
            filter.user_id = req.query.user_id;
        }
        const documents = await orderService.find(filter);
        return res.json(documents);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "An error occurred while retrieving the orders"));
    }
}

export async function findOne(req, res, next) {
    try {
        const document = await orderService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Order not found"));
        }
        return res.json(document);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Error while retrieving order with id ${req.params.id}`));
    }
}

export async function update(req, res, next) {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Data to update cannot be empty"));
    }
    try {
        const document = await orderService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, "Order not found"));
        }
        return res.json({ message: "Order updated successfully", document });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Error while updating order with id ${req.params.id}`));
    }
}

export async function deleteOne(req, res, next) {
    try {
        const document = await orderService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Order not found"));
        }
        return res.send({ message: "Order deleted successfully" });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, `Could not delete order with id ${req.params.id}`));
    }
}

export async function deleteAll(req, res, next) {
    try {
        const deletedCount = await orderService.deleteAll();
        return res.json({
            message: `${deletedCount} orders were deleted successfully`
        });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "An error occurred while deleting all orders"));
    }
}

export async function getStats(req, res, next) {
    try {
        const stats = await orderService.getStats();
        return res.json(stats);
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, "An error occurred while retrieving statistics"));
    }
}

export default {
    create, findAll, findOne, update, deleteOne, deleteAll, getStats
};
