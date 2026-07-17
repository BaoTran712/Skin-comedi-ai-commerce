import Order from "../models/order.model.js";
import OrderDetail from "../models/order_detail.model.js";
import Payment from "../models/payment.model.js";
import ShippingTracking from "../models/shipping_tracking.model.js";
import Product from "../models/product.model.js";

const statusDescriptions = {
    pending: "Đơn hàng đã được tạo, đang chờ xác nhận",
    confirmed: "Đơn hàng đã được xác nhận bởi nhân viên",
    shipping: "Đơn hàng đã được giao cho đơn vị vận chuyển",
    delivered: "Đơn hàng đã được giao thành công",
    cancelled: "Đơn hàng đã bị hủy",
};

class OrderService {
    async populateOrderDetails(orderDoc) {
        if (!orderDoc) return null;
        
        // Convert to plain object
        const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
        
        // 1. Fetch OrderDetail and populate product_id & brand_id
        const detail = await OrderDetail.findOne({ order_id: order._id })
            .populate({
                path: "product_id",
                populate: {
                    path: "brand_id",
                    model: "Brand"
                }
            })
            .populate("variant_id");
        
        if (detail) {
            order.product_id = detail.product_id;
            order.variant_id = detail.variant_id;
            order.quantity = detail.quantity;
            order.price_at_purchase = detail.price_at_purchase;
        } else {
            order.product_id = null;
            order.variant_id = null;
            order.quantity = 0;
            order.price_at_purchase = 0;
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
        try {
            // 1. Fetch product to calculate amount
            const product = await Product.findById(payload.product_id);
            if (!product) {
                throw new Error("Product not found");
            }

            let price = product.flash_sale_price || product.price;
            let variant = null;
            
            if (payload.variant_id) {
                const Variant = (await import('../models/variant.model.js')).default;
                variant = await Variant.findById(payload.variant_id);
                if (variant) {
                    price = variant.price;
                }
            }

            const qty = payload.quantity || 1;
            const subtotal = price * qty;
            const discount_amount = 0;
            const total_amount = subtotal - discount_amount;

            // 2. Resolve shipping address and phone number from user's addresses
            const User = (await import('../models/user.model.js')).default; // dynamic import to avoid circular deps
            const user = await User.findById(payload.user_id);
            if (!user) {
                throw new Error("User not found");
            }
            const selected = user.addresses.id(payload.addressId);
            if (!selected) {
                throw new Error("Address not found");
            }

            // 3. Save Order with resolved address fields
            const order = new Order({
                user_id: payload.user_id,
                shipping_address: selected.address,
                phone_number: selected.phone,
                status: "pending",
                subtotal,
                discount_amount,
                total_amount,
            });
            const savedOrder = await order.save();

            // 3. Save OrderDetail
            const orderDetail = new OrderDetail({
                order_id: savedOrder._id,
                product_id: product._id,
                variant_id: variant ? variant._id : undefined,
                quantity: qty,
                price_at_purchase: price,
            });
            await orderDetail.save();

            // 4. Save Payment
            const payment = new Payment({
                order_id: savedOrder._id,
                user_id: payload.user_id,
                payment_method: payload.payment_method || "COD",
                payment_status: "unpaid",
                amount: total_amount,
                transaction_id: `TX-${Date.now()}`,
            });
            await payment.save();

            // 5. Save initial Shipping Tracking entry
            const shippingTracking = new ShippingTracking({
                order_id: savedOrder._id,
                status: "pending",
                location: "Hệ thống",
                description: statusDescriptions["pending"],
            });
            await shippingTracking.save();

            // Return populated order
            return await this.findById(savedOrder._id);
        } catch (error) {
            console.log(error);
            throw error;
        }
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
        const updateData = { ...payload };

        // If status is being changed, create a new ShippingTracking entry
        if (payload.status && statusDescriptions[payload.status]) {
            const shippingTracking = new ShippingTracking({
                order_id: id,
                status: payload.status,
                location: payload.status === "delivered" ? "Người nhận" : "Hệ thống",
                description: payload.tracking_description || statusDescriptions[payload.status],
            });
            await shippingTracking.save();

            // If delivered via COD, mark payment as paid
            if (payload.status === "delivered") {
                const payment = await Payment.findOne({ order_id: id });
                if (payment && payment.payment_method === "COD") {
                    await Payment.findOneAndUpdate(
                        { order_id: id },
                        { $set: { payment_status: "paid" } }
                    );
                }
            }
        }

        // If payment status is changing directly, update Payment document
        if (payload.payment_status) {
            await Payment.findOneAndUpdate(
                { order_id: id },
                { $set: { payment_status: payload.payment_status } }
            );
        }

        const result = await Order.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        return await this.findById(id);
    }

    async delete(id) {
        // Delete related documents first
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

        const deliveredOrdersList = await Order.find({ status: "delivered" });
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
