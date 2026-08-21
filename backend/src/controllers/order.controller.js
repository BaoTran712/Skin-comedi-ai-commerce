import OrderService from "../services/order.service.js";
import ApiError from "../api-error.js";
import mongoose from "mongoose";
import { creditPointsForOrder } from "../services/points.service.js";

const orderService = new OrderService();

export async function create(req, res, next) {
    const { user_id, product_id, items, addressId } = req.body || {};
    
    const hasItems = (Array.isArray(items) && items.length > 0) || product_id;

    if (!user_id || !hasItems || !addressId) {
        return next(new ApiError(400, "Thiếu thông tin người dùng, sản phẩm hoặc địa chỉ giao hàng"));
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return next(new ApiError(400, "Định dạng ID người dùng không hợp lệ"));
    }
    if (product_id && !mongoose.Types.ObjectId.isValid(product_id)) {
        return next(new ApiError(400, "Định dạng ID sản phẩm không hợp lệ"));
    }

    try {
        const document = await orderService.create(req.body);
        return res.status(201).json({ message: "Tạo đơn hàng thành công", document });
    } catch (error) {
        console.error("Order Create Error:", error);
        const statusCode = error.message?.includes("không đủ tồn kho") || 
                           error.message?.includes("not found") || 
                           error.message?.includes("không tồn tại") ? 400 : 500;
        return next(new ApiError(statusCode, error.message || "Đã xảy ra lỗi khi tạo đơn hàng"));
    }
}

export async function findAll(req, res, next) {
    try {
        const userRole = (req.user?.role || "").toString().trim().toUpperCase();
        const isStaffOrAdmin = userRole === "STAFF" || userRole === "ADMIN" || userRole === "EMPLOYEE";

        // Setup filter
        let filter = {};

        // If not staff/admin, they can only view their own orders
        if (!isStaffOrAdmin) {
            filter.user_id = req.user?.id || req.userId;
            if (!filter.user_id) {
                return next(new ApiError(401, "Người dùng chưa được xác thực"));
            }
        } else if (req.query.user_id) {
            if (!mongoose.Types.ObjectId.isValid(req.query.user_id)) {
                return next(new ApiError(400, "Định dạng user_id không hợp lệ"));
            }
            filter.user_id = req.query.user_id;
        }

        // If paginate is true or lookup is true, run findAdvanced
        if (req.query.paginate === "true" || req.query.lookup === "true") {
            if (!isStaffOrAdmin) {
                return next(new ApiError(403, "Bạn không có quyền sử dụng tính năng tra cứu đơn hàng nâng cao"));
            }

            const options = {
                page: parseInt(req.query.page, 10) || 1,
                limit: parseInt(req.query.limit, 10) || 10,
                search: req.query.search,
                status: req.query.status,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                minAmount: req.query.minAmount,
                maxAmount: req.query.maxAmount,
                payment_method: req.query.payment_method,
                payment_status: req.query.payment_status,
                user_id: filter.user_id
            };

            const result = await orderService.findAdvanced(options);
            return res.json(result);
        }

        // Default backward-compatible behavior
        const documents = await orderService.find(filter);
        return res.json(documents);
    } catch (error) {
        console.error("Order FindAll Error:", error);
        return next(new ApiError(500, "Đã xảy ra lỗi khi lấy danh sách đơn hàng"));
    }
}

export async function findOne(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, "Định dạng ID đơn hàng không hợp lệ"));
    }
    try {
        const document = await orderService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy đơn hàng"));
        }
        return res.json(document);
    } catch (error) {
        console.error("Order FindOne Error:", error);
        return next(new ApiError(500, `Lỗi khi lấy thông tin đơn hàng với id ${req.params.id}`));
    }
}

export async function update(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, "Định dạng ID đơn hàng không hợp lệ"));
    }
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, "Dữ liệu cập nhật không được để trống"));
    }

    try {
        const order = await orderService.findById(req.params.id);
        if (!order) {
            return next(new ApiError(404, "Không tìm thấy đơn hàng"));
        }

        // Authorization check
        if (req.body.status || req.body.payment_status) {
            const userRole = req.user?.role;
            const userId = req.user?.id || req.userId;

            if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
                const isOwner = order.user_id && (
                    (order.user_id._id && order.user_id._id.toString() === userId.toString()) ||
                    (order.user_id.toString() === userId.toString())
                );
                const isCancellingPending = req.body.status === 'cancelled' && (order.status === 'pending' || order.status === 'confirmed');
                const isRequestingReturn = req.body.status === 'return_requested' && (order.status === 'delivered' || order.status === 'completed');
                const isChangingPaymentStatus = !!req.body.payment_status;

                if (!isOwner || (!isCancellingPending && !isRequestingReturn) || isChangingPaymentStatus) {
                    return next(new ApiError(403, "Bạn không có quyền thay đổi trạng thái đơn hàng hoặc thanh toán này"));
                }
            }
        }

        const document = await orderService.update(req.params.id, req.body);
        if (document && (document.payment_status === 'paid' || document.status === 'completed' || document.status === 'delivered')) {
            await creditPointsForOrder(req.params.id);
        }
        return res.json({ message: "Cập nhật đơn hàng thành công", document });
    } catch (error) {
        console.error("Order Update Error:", error);
        const is400 = error.message?.includes("Không thể chuyển") || 
                       error.message?.includes("không tồn tại");
        return next(new ApiError(is400 ? 400 : 500, error.message || `Lỗi khi cập nhật đơn hàng với id ${req.params.id}`));
    }
}

export async function deleteOne(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError(400, "Định dạng ID đơn hàng không hợp lệ"));
    }
    try {
        const document = await orderService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy đơn hàng"));
        }
        return res.json({ message: "Xóa đơn hàng thành công" });
    } catch (error) {
        console.error("Order Delete Error:", error);
        return next(new ApiError(500, `Không thể xóa đơn hàng với id ${req.params.id}`));
    }
}

export async function deleteAll(req, res, next) {
    try {
        const deletedCount = await orderService.deleteAll();
        return res.json({
            message: `Đã xóa thành công ${deletedCount} đơn hàng`
        });
    } catch (error) {
        console.error("Order DeleteAll Error:", error);
        return next(new ApiError(500, "Đã xảy ra lỗi khi xóa tất cả đơn hàng"));
    }
}

export async function getStats(req, res, next) {
    try {
        const stats = await orderService.getStats();
        return res.json(stats);
    } catch (error) {
        console.error("Order GetStats Error:", error);
        return next(new ApiError(500, "Đã xảy ra lỗi khi lấy thống kê đơn hàng"));
    }
}

export default {
    create, findAll, findOne, update, deleteOne, deleteAll, getStats
};
