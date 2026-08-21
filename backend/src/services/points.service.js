import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import PointTransaction from "../models/pointTransaction.model.js";

export const POINTS_RATIO = 10000; // 10.000 VND = 1 Xu

export async function creditPointsForOrder(orderId) {
    try {
        const order = await Order.findById(orderId);
        if (!order) return null;

        // Idempotency check: Do NOT credit points multiple times
        if (order.points_credited) {
            console.log(`[POINTS] Order ${orderId} already credited points. Skipping.`);
            return false;
        }

        // Only credit when payment_status is 'paid' OR status is 'completed'
        const isPaid = order.payment_status === 'paid' || order.status === 'completed' || order.status === 'delivered';
        if (!isPaid) {
            return false;
        }

        const xuEarned = Math.floor(Number(order.total_amount || 0) / POINTS_RATIO);
        if (xuEarned <= 0) {
            order.points_credited = true;
            await order.save();
            return false;
        }

        const user = await User.findById(order.user_id);
        if (!user) return false;

        user.points = (user.points || 0) + xuEarned;
        
        // Update user rank based on total points
        if (user.points >= 1000) user.rank = "diamond";
        else if (user.points >= 500) user.rank = "gold";
        else if (user.points >= 200) user.rank = "silver";

        await user.save();

        const orderCodeStr = order.order_code || order._id.toString().slice(-8).toUpperCase();

        // Create transaction log
        const transaction = new PointTransaction({
            user_id: user._id,
            type: "EARN",
            amount: xuEarned,
            balance_after: user.points,
            description: `Tích điểm đơn hàng #${orderCodeStr}`,
            order_id: order._id
        });
        await transaction.save();

        order.points_earned = xuEarned;
        order.points_credited = true;
        await order.save();

        console.log(`[POINTS SUCCESS] Credited +${xuEarned} Xu to user ${user.username} for Order #${orderCodeStr}`);
        return true;
    } catch (err) {
        console.error(`[POINTS ERROR] Failed to credit points for order ${orderId}:`, err);
        return false;
    }
}

export default { creditPointsForOrder, POINTS_RATIO };
