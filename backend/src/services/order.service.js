import Order from "../models/order.model.js";
import OrderDetail from "../models/order_detail.model.js";
import Payment from "../models/payment.model.js";
import ShippingTracking from "../models/shipping_tracking.model.js";
import Product from "../models/product.model.js";
import NotificationService from "./notification.service.js";
import mongoose from "mongoose";
import shippingService from "./shipping.service.js";
import emailService from "./email.service.js";
import User from "../models/user.model.js";


const statusDescriptions = {
    cancelled: "Đã hủy đơn hàng",
    pending: "Đơn hàng đã được đặt, đang chờ xác nhận",
    confirmed: "Đơn hàng đã được xác nhận, đang chuẩn bị hàng",
    shipping: "Đơn hàng đang được vận chuyển",
    delivered: "Khách hàng đã nhận hàng",
    completed: "Đơn hàng đã hoàn thành (Đã mua)",
    return_requested: "Đang yêu cầu Trả hàng / Hoàn tiền",
    returning: "Đang chuyển hàng hoàn về kho",
    returned: "Đã nhận hàng hoàn tại kho",
    refunded: "Đã hoàn tiền cho khách hàng",
};

// Valid status transitions: key = current status, value = array of allowed next statuses
const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipping", "cancelled"],
    shipping: ["delivered", "returning"],
    delivered: ["completed", "return_requested"],
    completed: ["return_requested"],
    return_requested: ["returning", "refunded", "completed", "cancelled"],
    returning: ["returned"],
    returned: ["refunded"],
    refunded: [],
    cancelled: [],
};

class OrderService {
    async populateOrderDetails(orderDoc) {
        if (!orderDoc) return null;
        
        // Convert to plain object
        const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
        
        // 1. Fetch all OrderDetails and populate product_id & brand_id
        const details = await OrderDetail.find({ order_id: order._id })
            .populate({
                path: "product_id",
                populate: {
                    path: "brand_id",
                    model: "Brand"
                }
            })
            .populate("variant_id");
        
        order.items = details || [];
        
        // Flat compatibility fields for legacy frontend compatibility (displaying first item)
        if (details && details.length > 0) {
            const firstDetail = details[0];
            order.product_id = firstDetail.product_id;
            order.variant_id = firstDetail.variant_id;
            order.quantity = firstDetail.quantity;
            order.price_at_purchase = firstDetail.price_at_purchase;
        } else {
            // Keep existing product_id if already present on orderDoc
            order.product_id = order.product_id || null;
            order.quantity = order.quantity || 1;
            order.price_at_purchase = order.price_at_purchase || order.total_amount || 0;
        }
        
        // 2. Fetch Payment
        const payment = await Payment.findOne({ order_id: order._id });
        if (payment) {
            order.payment_method = payment.payment_method;
            order.payment_status = payment.payment_status;
            order.transaction_id = payment.transaction_id;
        } else {
            order.payment_method = "COD";
            order.payment_status = "unpaid";
            order.transaction_id = null;
        }
        
        // 3. Fetch Shipping Tracking entries and map to tracking_history
        const trackings = await ShippingTracking.find({ order_id: order._id }).sort({ timestamp: 1 });
        order.tracking_history = trackings.map(t => ({
            status: t.status,
            description: t.description,
            timestamp: t.timestamp
        }));
        
        return order;
    }

    async create(payload) {
        let session = null;
        try {
            session = await mongoose.startSession();
            session.startTransaction();
            const result = await this.executeCreateOrder(payload, session);
            await session.commitTransaction();
            session.endSession();
            return result;
        } catch (error) {
            if (session) {
                try { await session.abortTransaction(); } catch (e) {}
                try { session.endSession(); } catch (e) {}
            }

            // Fallback for Standalone MongoDB without Replica Set
            if (
                error.message?.includes("Transaction numbers are only allowed") ||
                error.code === 20 ||
                error.codeName === "TransactionRecordStateInvalid"
            ) {
                console.warn("MongoDB running in standalone mode. Executing order creation sequentially without transaction.");
                return await this.executeCreateOrder(payload, null);
            }

            throw error;
        }
    }

    async executeCreateOrder(payload, session = null) {
        const sessionOpt = session ? { session } : {};

        // Support both multiple items and single item payload
        const items = payload.items || [
            {
                product_id: payload.product_id,
                variant_id: payload.variant_id,
                quantity: payload.quantity || 1
            }
        ];

        if (items.length === 0) {
            throw new Error("Đơn hàng phải chứa ít nhất một sản phẩm.");
        }

        // 1. Resolve shipping address from user's embedded addresses
        const User = (await import('../models/user.model.js')).default;
        const userQuery = User.findById(payload.user_id);
        if (session) userQuery.session(session);
        const user = await userQuery;

        if (!user) {
            throw new Error("User not found");
        }
        const selected = user.addresses.id(payload.addressId);
        if (!selected) {
            throw new Error("Address not found. Vui lòng chọn địa chỉ giao hàng hợp lệ.");
        }
        if (!selected.provinceCode || !selected.districtCode || !selected.wardCode || !selected.addressDetail || !selected.phone) {
            throw new Error("Vui lòng nhập đầy đủ thông tin địa chỉ (Tỉnh, Huyện, Xã, Địa chỉ chi tiết, Số điện thoại)");
        }

        // 2. Validate all items & calculate subtotal
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const productQuery = Product.findById(item.product_id);
            if (session) productQuery.session(session);
            const product = await productQuery;

            if (!product) {
                throw new Error(`Sản phẩm với ID ${item.product_id} không tồn tại`);
            }

            let price = product.flash_sale_price || product.price;
            let variant = null;

            if (item.variant_id) {
                const Variant = (await import('../models/variant.model.js')).default;
                const variantQuery = Variant.findById(item.variant_id);
                if (session) variantQuery.session(session);
                variant = await variantQuery;
                if (variant) {
                    price = variant.price;
                }
            }

            const qty = item.quantity || 1;

            // Check sufficient stock
            const availableStock = variant ? variant.quantity : product.quantity;
            if (availableStock < qty) {
                throw new Error(`Sản phẩm "${product.title}" không đủ tồn kho. Còn lại: ${availableStock}`);
            }

            subtotal += price * qty;
            validatedItems.push({
                product,
                variant,
                qty,
                price
            });
        }

        // 2.5 Calculate Discounts (Voucher & Points)
        let discount_voucher = 0;
        let promotion = null;
        const promoId = payload.promotion_id || payload.id_voucher;
        if (promoId) {
            const Promotion = (await import('../models/promotion.model.js')).default;
            promotion = await Promotion.findById(promoId).session(session);
            if (!promotion) {
                throw new Error("Mã giảm giá không tồn tại hoặc đã bị xóa.");
            }
            if (promotion.status !== "active") {
                throw new Error("Mã giảm giá không hoạt động.");
            }
            const now = new Date();
            if (now < new Date(promotion.start_date) || now > new Date(promotion.end_date)) {
                throw new Error("Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng.");
            }
            if (subtotal < promotion.min_order_value) {
                throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu ${promotion.min_order_value.toLocaleString('vi-VN')} ₫ để áp dụng voucher.`);
            }
            if (promotion.usage_limit !== null && promotion.used_count >= promotion.usage_limit) {
                throw new Error("Mã giảm giá đã hết lượt sử dụng.");
            }

            if (promotion.discount_type === "percentage") {
                discount_voucher = Math.round(subtotal * (promotion.discount_value / 100));
                if (promotion.max_discount_amount) {
                    discount_voucher = Math.min(discount_voucher, promotion.max_discount_amount);
                }
            } else if (promotion.discount_type === "fixed_amount") {
                discount_voucher = promotion.discount_value;
            }
            discount_voucher = Math.min(discount_voucher, subtotal);
        }

        let discount_points = 0;
        let points_used = Number(payload.points_used || payload.xu_su_dung || 0);
        if (points_used > 0) {
            if (user.points < points_used) {
                throw new Error(`Số xu tích lũy của bạn không đủ. Bạn hiện có ${user.points} xu.`);
            }
            // Conversion rate: 1 Xu = 1.000 VND
            discount_points = points_used * 1000;

            const maxPointsDiscount = Math.max(0, subtotal - discount_voucher);
            if (discount_points > maxPointsDiscount) {
                discount_points = maxPointsDiscount;
                points_used = Math.ceil(discount_points / 1000);
                discount_points = points_used * 1000;
            }
        }

        const discount_amount = discount_voucher + discount_points;
        const shipping_method = payload.shipping_method || 'standard';
        const shipping_fee = payload.shipping_fee !== undefined ? Number(payload.shipping_fee) : shippingService.calculateFee(shipping_method, selected.provinceCode);
        const total_amount = Math.max(0, subtotal + shipping_fee - discount_amount);

        // 3. Generate unique order code
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
        const order_code = `ORD-${dateStr}-${randomSuffix}`;

        // 4. Deduct stock for all items
        for (const vItem of validatedItems) {
            if (vItem.variant) {
                const Variant = (await import('../models/variant.model.js')).default;
                await Variant.findByIdAndUpdate(vItem.variant._id, { $inc: { quantity: -vItem.qty } }, sessionOpt);
            } else {
                await Product.findByIdAndUpdate(vItem.product._id, { $inc: { quantity: -vItem.qty } }, sessionOpt);
            }
        }

        // 5. Save Order
        const order = new Order({
            order_code,
            user_id: payload.user_id,
            shipping_address: {
                recipientName: selected.recipientName || `${user.last_name || ''} ${user.first_name || ''}`.trim() || 'Khách hàng',
                provinceCode: selected.provinceCode,
                provinceName: selected.provinceName,
                districtCode: selected.districtCode,
                districtName: selected.districtName,
                wardCode: selected.wardCode,
                wardName: selected.wardName,
                addressDetail: selected.addressDetail,
            },
            phone_number: selected.phone,
            status: "pending",
            payment_method: payload.payment_method || "COD",
            shipping_method,
            shipping_fee,
            subtotal,
            discount_amount,
            discount_voucher,
            discount_points,
            points_used,
            promotion_id: promoId || undefined,
            total_amount,
            note: payload.note || "",
        });
        const savedOrder = await order.save(sessionOpt);

        // 5.5 Deduct points from user & Increment Voucher usage
        if (points_used > 0) {
            user.points = Math.max(0, user.points - points_used);
            await user.save(sessionOpt);

            const PointTransaction = (await import('../models/pointTransaction.model.js')).default;
            const transaction = new PointTransaction({
                user_id: user._id,
                type: "SPEND",
                amount: -points_used,
                balance_after: user.points,
                description: `Sử dụng xu cho đơn hàng #${order_code}`,
                order_id: savedOrder._id
            });
            await transaction.save(sessionOpt);
        }

        if (promotion) {
            promotion.used_count += 1;
            await promotion.save(sessionOpt);
        }

        // 6. Save OrderDetails for all items
        for (const vItem of validatedItems) {
            const orderDetail = new OrderDetail({
                order_id: savedOrder._id,
                product_id: vItem.product._id,
                variant_id: vItem.variant ? vItem.variant._id : undefined,
                quantity: vItem.qty,
                price_at_purchase: vItem.price,
            });
            await orderDetail.save(sessionOpt);
        }

        // 7. Save Payment
        const payment = new Payment({
            order_id: savedOrder._id,
            user_id: payload.user_id,
            payment_method: payload.payment_method || "COD",
            payment_status: "unpaid",
            amount: total_amount,
            transaction_id: `TX-${Date.now()}`,
        });
        await payment.save(sessionOpt);

        // 8. Save initial ShippingTracking
        const shippingTracking = new ShippingTracking({
            order_id: savedOrder._id,
            status: "pending",
            location: "Hệ thống",
            description: statusDescriptions["pending"],
        });
        await shippingTracking.save(sessionOpt);

        // 9. Create Notification
        try {
            const notificationService = new NotificationService();
            await notificationService.create({
                user_id: payload.user_id,
                title: "Đặt hàng thành công",
                message: `Đơn hàng #${order_code} đã được đặt thành công.`,
                type: "order"
            }, sessionOpt);
        } catch (err) {
            console.error("Failed to create notification:", err);
        }

        // 10. Send Email Confirmation
        try {
            const firstItem = validatedItems[0];
            await emailService.sendOrderConfirmation(
                savedOrder,
                user,
                {
                    product_name: firstItem.product.title + (validatedItems.length > 1 ? ` và ${validatedItems.length - 1} sản phẩm khác` : ''),
                    quantity: firstItem.qty,
                    price: firstItem.price
                }
            );
        } catch (emailErr) {
            console.error("Lỗi gửi email xác nhận đặt hàng:", emailErr);
        }

        // Return populated order
        return await this.findById(savedOrder._id);
    }

    async find(filter) {
        const orders = await Order.find(filter)
            .populate("user_id")
            .populate("staff_id")
            .sort({ createdAt: -1 });

        const populatedOrders = [];
        for (let order of orders) {
            const populated = await this.populateOrderDetails(order);
            populatedOrders.push(populated);
        }
        return populatedOrders;
    }

    async findAdvanced(options = {}) {
        const {
            page = 1,
            limit = 10,
            search = "",
            status = "",
            startDate,
            endDate,
            minAmount,
            maxAmount,
            payment_method,
            payment_status,
            user_id
        } = options;

        const skip = (page - 1) * limit;
        const query = {};

        // Force user_id filter if specified (e.g. for customer isolation)
        if (user_id) {
            query.user_id = user_id;
        }

        // 1. General search (order_code, user details, phone)
        if (search && search.trim() !== "") {
            const trimmedSearch = search.trim();
            const searchRegex = new RegExp(trimmedSearch, "i");

            // Find users matching search term (name, email, username, phone)
            const matchingUsers = await User.find({
                $or: [
                    { first_name: searchRegex },
                    { last_name: searchRegex },
                    { username: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    {
                        $expr: {
                            $regexMatch: {
                                input: { $concat: [{ $ifNull: ["$first_name", ""] }, " ", { $ifNull: ["$last_name", ""] }] },
                                regex: searchRegex.source,
                                options: "i"
                            }
                        }
                    },
                    {
                        $expr: {
                            $regexMatch: {
                                input: { $concat: [{ $ifNull: ["$last_name", ""] }, " ", { $ifNull: ["$first_name", ""] }] },
                                regex: searchRegex.source,
                                options: "i"
                            }
                        }
                    }
                ]
            }).select("_id");
            
            const userIds = matchingUsers.map(u => u._id);

            query.$or = [
                { order_code: searchRegex },
                { phone_number: searchRegex },
                { user_id: { $in: userIds } }
            ];

            if (mongoose.Types.ObjectId.isValid(trimmedSearch)) {
                query.$or.push({ _id: trimmedSearch });
            }
        }

        // 2. Specific status filter
        if (status && status !== "") {
            if (status === "revenue") {
                query.status = { $in: ["delivered", "completed"] };
            } else {
                query.status = status;
            }
        }

        // 3. Date range filter
        const isValidDate = (d) => d && d !== "null" && d !== "undefined" && !isNaN(new Date(d).getTime());
        const hasStartDate = isValidDate(startDate);
        const hasEndDate = isValidDate(endDate);

        if (hasStartDate || hasEndDate) {
            query.order_date = {};
            if (hasStartDate) {
                query.order_date.$gte = new Date(startDate);
            }
            if (hasEndDate) {
                query.order_date.$lte = new Date(endDate);
            }
        }

        // 4. Amount range filter
        if (minAmount !== undefined && minAmount !== null && minAmount !== "" && !isNaN(minAmount)) {
            query.total_amount = query.total_amount || {};
            query.total_amount.$gte = Number(minAmount);
        }
        if (maxAmount !== undefined && maxAmount !== null && maxAmount !== "" && !isNaN(maxAmount)) {
            query.total_amount = query.total_amount || {};
            query.total_amount.$lte = Number(maxAmount);
        }

        // 5. Payment method
        if (payment_method && payment_method !== "" && payment_method !== "all") {
            query.payment_method = payment_method;
        }

        // 6. Payment status filter
        if (payment_status && payment_status !== "" && payment_status !== "all") {
            const matchingPayments = await Payment.find({ payment_status }).select("order_id");
            const orderIdsFromPayments = matchingPayments.map(p => p.order_id);

            if (payment_status === "unpaid") {
                const allPaidOrRefunded = await Payment.find({ payment_status: { $in: ["paid", "refunded"] } }).select("order_id");
                const paidOrRefundedOrderIds = allPaidOrRefunded.map(p => p.order_id);
                query._id = { $nin: paidOrRefundedOrderIds };
            } else {
                query._id = { $in: orderIdsFromPayments };
            }
        }

        // Calculate counts for matched period
        // For status count statistics, we only filter by date range to match current dashboard behavior
        const statsQuery = {};
        if (hasStartDate || hasEndDate) {
            statsQuery.order_date = {};
            if (hasStartDate) statsQuery.order_date.$gte = new Date(startDate);
            if (hasEndDate) statsQuery.order_date.$lte = new Date(endDate);
        }
        
        const statusCountsRaw = await Order.aggregate([
            { $match: statsQuery },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const statusCounts = { pending: 0, confirmed: 0, shipping: 0, delivered: 0, completed: 0, cancelled: 0 };
        statusCountsRaw.forEach(item => {
            if (statusCounts[item._id] !== undefined) {
                statusCounts[item._id] = item.count;
            }
        });

        // Compute delayed orders count
        const curDate = new Date();
        const oneDayAgo = new Date(curDate.getTime() - 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(curDate.getTime() - 3 * 24 * 60 * 60 * 1000);

        const delayedQuery = {
            $or: [
                { status: "pending", order_date: { $lt: oneDayAgo } },
                { status: "shipping", updatedAt: { $lt: threeDaysAgo } }
            ]
        };
        const delayedCount = await Order.countDocuments(delayedQuery);

        // Compute total revenue of matched orders (delivered & completed status only)
        const revenueQuery = { ...query, status: { $in: ["delivered", "completed"] } };
        const revenueRaw = await Order.aggregate([
            { $match: revenueQuery },
            { $group: { _id: null, total: { $sum: "$total_amount" } } }
        ]);
        const totalRevenue = revenueRaw[0]?.total || 0;

        // Perform main paginated lookup
        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate("user_id")
            .populate("staff_id")
            .sort({ order_date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const populatedOrders = [];
        for (let order of orders) {
            const populated = await this.populateOrderDetails(order);
            populatedOrders.push(populated);
        }

        return {
            orders: populatedOrders,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
            statusCounts,
            delayedCount,
            totalRevenue
        };
    }


    async findById(id) {
        const order = await Order.findById(id)
            .populate("user_id")
            .populate("staff_id");
        return await this.populateOrderDetails(order);
    }

    async findByUserId(user_id) {
        return await this.find({ user_id });
    }

    async update(id, payload) {
        const currentOrder = await Order.findById(id);
        if (!currentOrder) {
            throw new Error("Đơn hàng không tồn tại");
        }

        // Validate status transition
        if (payload.status && payload.status !== currentOrder.status) {
            const allowed = validTransitions[currentOrder.status] || [];
            if (!allowed.includes(payload.status)) {
                throw new Error(
                    `Không thể chuyển trạng thái từ "${statusDescriptions[currentOrder.status]}" sang "${statusDescriptions[payload.status]}". Các trạng thái hợp lệ: ${allowed.map(s => statusDescriptions[s]).join(", ") || "Không có"}`
                );
            }

            // Enforce that prepaid orders must have payment_status = paid before confirmation
            if (payload.status === "confirmed" && currentOrder.payment_method !== "COD") {
                const payment = await Payment.findOne({ order_id: id });
                if (!payment || payment.payment_status !== "paid") {
                    throw new Error("Đơn hàng thanh toán trực tuyến/chuyển khoản chưa được thanh toán hoặc đang chờ đối soát. Vui lòng xác nhận thanh toán trước khi duyệt đơn hàng.");
                }
            }
        }

            // If status is being changed, create a new ShippingTracking entry
        if (payload.status && statusDescriptions[payload.status] && payload.status !== currentOrder.status) {
            const shippingTracking = new ShippingTracking({
                order_id: id,
                status: payload.status,
                location: payload.status === "delivered" ? "Người nhận" : "Hệ thống",
                description: payload.tracking_description || statusDescriptions[payload.status],
            });
            await shippingTracking.save();

            // Create Notification
            try {
                const notificationService = new NotificationService();
                await notificationService.create({
                    user_id: currentOrder.user_id,
                    title: "Cập nhật đơn hàng",
                    message: `Đơn hàng của bạn đã chuyển sang trạng thái: ${statusDescriptions[payload.status]}`,
                    type: "order"
                });
            } catch (err) {
                console.error("Failed to create notification:", err);
            }

            // If delivered via COD, mark payment as paid
            if (payload.status === "delivered") {
                const payment = await Payment.findOne({ order_id: id });
                if (payment && payment.payment_method === "COD") {
                    await Payment.findOneAndUpdate(
                        { order_id: id },
                        { $set: { payment_status: "paid" } }
                    );
                }

                // Schedule transition to "completed" after 10 minutes
                setTimeout(async () => {
                    try {
                        const latestOrder = await Order.findById(id);
                        if (latestOrder && latestOrder.status === 'delivered') {
                            await this.update(id, { status: 'completed' });
                        }
                    } catch (err) {
                        console.error('Failed to auto-complete order', err);
                    }
                }, 10 * 60 * 1000);
            }

            // If cancelled, restore stock
            if (payload.status === "cancelled") {
                // Only restore if it wasn't already cancelled
                if (currentOrder.status !== "cancelled") {
                    const details = await OrderDetail.find({ order_id: id });
                    for (const detail of details) {
                        if (detail.variant_id) {
                            const Variant = (await import('../models/variant.model.js')).default;
                            await Variant.findByIdAndUpdate(detail.variant_id, {
                                $inc: { quantity: detail.quantity }
                            });
                        } else {
                            await Product.findByIdAndUpdate(detail.product_id, {
                                $inc: { quantity: detail.quantity }
                            });
                        }
                    }

                    // Refund points/xu to user
                    if (currentOrder.points_used > 0) {
                        const user = await User.findById(currentOrder.user_id);
                        if (user) {
                            user.points = (user.points || 0) + currentOrder.points_used;
                            await user.save();

                            const PointTransaction = (await import('../models/pointTransaction.model.js')).default;
                            const transaction = new PointTransaction({
                                user_id: user._id,
                                type: "REFUND",
                                amount: currentOrder.points_used,
                                balance_after: user.points,
                                description: `Hoàn xu hủy đơn hàng #${currentOrder.order_code || id}`,
                                order_id: currentOrder._id
                            });
                            await transaction.save();
                            console.log(`[POINTS REFUND] Refunded +${currentOrder.points_used} Xu to user ${user.username} for cancelled Order #${currentOrder.order_code || id}`);
                        }
                    }
                }
            }
        }
        // If payment status is changing directly, update Payment document
        if (payload.payment_status) {
            const oldPayment = await Payment.findOne({ order_id: id });
            await Payment.findOneAndUpdate(
                { order_id: id },
                { $set: { payment_status: payload.payment_status } }
            );

            if (payload.payment_status === "paid" && (!oldPayment || oldPayment.payment_status !== "paid")) {
                // Create Notification for Customer
                try {
                    const notificationService = new NotificationService();
                    await notificationService.create({
                        user_id: currentOrder.user_id,
                        title: "Thanh toán thành công",
                        message: `Đơn hàng #${currentOrder.order_code || id} đã nhận được thanh toán.`,
                        type: "order"
                    });

                    // Create Notification for Admin/Staff
                    const User = (await import('../models/user.model.js')).default;
                    const adminsAndStaff = await User.find({ role: { $in: ["ADMIN", "STAFF"] } });
                    for (const staff of adminsAndStaff) {
                        await notificationService.create({
                            user_id: staff._id,
                            title: "Đơn hàng mới đã thanh toán",
                            message: `Đơn hàng #${currentOrder.order_code || id} đã thanh toán thành công và chờ xác nhận.`,
                            type: "order",
                            link: "/orderpending"
                        });
                    }
                } catch (err) {
                    console.error("Failed to create notifications:", err);
                }

                // Send email
                try {
                    const User = (await import('../models/user.model.js')).default;
                    const user = await User.findById(currentOrder.user_id);
                    if (user && user.email) {
                        await emailService.sendPaymentConfirmation(currentOrder, user);
                    }
                } catch (emailErr) {
                    console.error("Lỗi gửi email xác nhận thanh toán:", emailErr);
                }
            }
        }

        // Clean updateData: only keep fields that exist in Order schema
        const allowedFields = ['status', 'staff_id', 'shipping_address', 'phone_number', 'tracking_number', 'carrier_name', 'delivery_date', 'note', 'promotion_id'];
        const updateData = {};
        for (const key of allowedFields) {
            if (payload[key] !== undefined) {
                updateData[key] = payload[key];
            }
        }

        if (Object.keys(updateData).length > 0) {
            await Order.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );
        }
        return await this.findById(id);
    }

    async delete(id) {
        const currentOrder = await Order.findById(id);
        if (!currentOrder) {
            throw new Error("Đơn hàng không tồn tại");
        }

        // Hoàn kho nếu đơn chưa được hủy (cancelled) và chưa được hoàn thành/giao thành công
        if (currentOrder.status !== "cancelled" && currentOrder.status !== "delivered" && currentOrder.status !== "completed") {
            const details = await OrderDetail.find({ order_id: id });
            for (const detail of details) {
                if (detail.variant_id) {
                    const Variant = (await import('../models/variant.model.js')).default;
                    await Variant.findByIdAndUpdate(detail.variant_id, {
                        $inc: { quantity: detail.quantity }
                    });
                } else {
                    await Product.findByIdAndUpdate(detail.product_id, {
                        $inc: { quantity: detail.quantity }
                    });
                }
            }

            // Refund points/xu to user
            if (currentOrder.points_used > 0) {
                const user = await User.findById(currentOrder.user_id);
                if (user) {
                    user.points = (user.points || 0) + currentOrder.points_used;
                    await user.save();

                    const PointTransaction = (await import('../models/pointTransaction.model.js')).default;
                    const transaction = new PointTransaction({
                        user_id: user._id,
                        type: "REFUND",
                        amount: currentOrder.points_used,
                        balance_after: user.points,
                        description: `Hoàn xu xóa đơn hàng #${currentOrder.order_code || id}`,
                        order_id: currentOrder._id
                    });
                    await transaction.save();
                }
            }
        }

        // Xóa các tài liệu liên quan
        await OrderDetail.deleteMany({ order_id: id });
        await Payment.deleteMany({ order_id: id });
        await ShippingTracking.deleteMany({ order_id: id });
        return await Order.findByIdAndDelete(id);
    }

    async deleteAll() {
        await OrderDetail.deleteMany({});
        await Payment.deleteMany({});
        await ShippingTracking.deleteMany({});
        const result = await Order.deleteMany({});
        return result.deletedCount;
    }

    async getStats() {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: "pending" });
        const confirmedOrders = await Order.countDocuments({ status: "confirmed" });
        const shippingOrders = await Order.countDocuments({ status: "shipping" });
        const deliveredOrders = await Order.countDocuments({ status: "delivered" });
        const cancelledOrders = await Order.countDocuments({ status: "cancelled" });

        const deliveredOrdersList = await Order.find({ status: { $in: ["delivered", "completed"] } });
        const totalRevenue = deliveredOrdersList.reduce((acc, order) => {
            return acc + (order.total_amount || 0);
        }, 0);

        return {
            totalOrders,
            pendingOrders,
            confirmedOrders,
            shippingOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue
        };
    }
}

export default OrderService;
