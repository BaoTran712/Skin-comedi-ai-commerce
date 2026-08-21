// backend/src/services/adminStats.service.js
//
// BUSINESS RULES (confirmed from db audit):
// - DATE FIELD: order_date (not createdAt — demo orders have createdAt=null)
// - totalOrders: ALL orders in date range (pending, confirmed, shipping, delivered, completed, cancelled)
// - totalRevenue: SUM(total_amount) only for status IN ['delivered', 'completed']
// - totalCustomers: COUNT(DISTINCT user_id) across ALL orders in range
// - totalProducts: COUNT(DISTINCT product_id) from order_details for delivered/completed orders only

import Order from '../models/order.model.js';
import OrderDetail from '../models/order_detail.model.js';
import Diagnosis from '../models/diagnosis.model.js';
/**
 * Build start/end Date objects for a given period + dateStr.
 * ALL times are in Asia/Ho_Chi_Minh (+07:00) to prevent timezone drift.
 */
export function getPeriodRanges(period, dateStr) {
    const now = new Date();
    let year  = now.getFullYear();
    let month = now.getMonth() + 1; // 1-indexed
    let day   = now.getDate();

    if (dateStr) {
        if (period === 'quarter' && dateStr.includes('-Q')) {
            const [y, q] = dateStr.split('-Q');
            year  = parseInt(y, 10);
            month = (parseInt(q, 10) - 1) * 3 + 1; // first month of quarter
            day   = 1;
        } else {
            const parts = dateStr.split('-');
            if (parts[0]) year  = parseInt(parts[0], 10);
            if (parts[1]) month = parseInt(parts[1], 10);
            if (parts[2]) day   = parseInt(parts[2], 10);
        }
    }

    let startDate, endDate;

    if (period === 'day') {
        const mm = month.toString().padStart(2, '0');
        const dd = day.toString().padStart(2, '0');
        startDate = new Date(`${year}-${mm}-${dd}T00:00:00+07:00`);
        endDate   = new Date(`${year}-${mm}-${dd}T23:59:59.999+07:00`);
    } else if (period === 'month') {
        const mm      = month.toString().padStart(2, '0');
        const lastDay = new Date(year, month, 0).getDate();
        startDate = new Date(`${year}-${mm}-01T00:00:00+07:00`);
        endDate   = new Date(`${year}-${mm}-${lastDay.toString().padStart(2, '0')}T23:59:59.999+07:00`);
    } else if (period === 'quarter') {
        let q = Math.ceil(month / 3);
        if (dateStr && dateStr.includes('-Q')) {
            q = parseInt(dateStr.split('-Q')[1], 10);
        }
        const startMonth = (q - 1) * 3 + 1;
        const endMonth   = q * 3;
        const lastDay    = new Date(year, endMonth, 0).getDate();
        startDate = new Date(`${year}-${startMonth.toString().padStart(2, '0')}-01T00:00:00+07:00`);
        endDate   = new Date(`${year}-${endMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}T23:59:59.999+07:00`);
    } else if (period === 'year') {
        startDate = new Date(`${year}-01-01T00:00:00+07:00`);
        endDate   = new Date(`${year}-12-31T23:59:59.999+07:00`);
    } else {
        // default: current month
        const mm      = (now.getMonth() + 1).toString().padStart(2, '0');
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        startDate = new Date(`${now.getFullYear()}-${mm}-01T00:00:00+07:00`);
        endDate   = new Date(`${now.getFullYear()}-${mm}-${lastDay.toString().padStart(2, '0')}T23:59:59.999+07:00`);
        year  = now.getFullYear();
        month = now.getMonth() + 1;
        day   = now.getDate();
    }

    return { startDate, endDate, year, month, day };
}

class AdminStatsService {
    async getDashboardStats(period = 'month', dateStr = '') {
        const { startDate, endDate, year, month, day } = getPeriodRanges(period, dateStr);

        // ─── 1. Query ALL orders in range using order_date ───────────────────
        const orders = await Order.find({
            order_date: { $gte: startDate, $lte: endDate }
        });

        let totalOrders    = orders.length;
        let pendingOrders  = 0;
        let confirmedOrders= 0;
        let shippingOrders = 0;
        let deliveredOrders= 0;
        let cancelledOrders= 0;
        let totalRevenue   = 0;
        const customerIds  = new Set();
        let taxTotal = 0;
        const revenueOrderIds = []; // only delivered/completed

        for (const order of orders) {
            switch (order.status) {
                case 'pending':    pendingOrders++;   break;
                case 'confirmed':  confirmedOrders++; break;
                case 'shipping':   shippingOrders++;  break;
                case 'delivered':
                case 'completed':
                    deliveredOrders++;
            totalRevenue += order.total_amount || 0;
            taxTotal += (order.total_amount || 0) * 0.10;
            revenueOrderIds.push(order._id);
                    break;
                case 'cancelled':  cancelledOrders++; break;
            }
            if (order.user_id) customerIds.add(order.user_id.toString());
        }

        const totalCustomers = customerIds.size;

        // ─── 2. Count distinct products from delivered/completed orders ──────
        let totalProducts = 0;
        // taxTotal initialized earlier
        if (revenueOrderIds.length > 0) {
            const distinct = await OrderDetail.distinct('product_id', {
                order_id: { $in: revenueOrderIds }
            });
            totalProducts = distinct.length;
        }
        // Tax total is already accumulated during order loop

        // ─── 3. Build chart using order_date ─────────────────────────────────
        const chartLabels = [];
        const chartValues = [];

        if (period === 'day') {
            const hourlyData = await Order.aggregate([
                { $match: {
                    order_date: { $gte: startDate, $lte: endDate },
                    status: { $in: ['delivered', 'completed'] }
                }},
                { $group: {
                    _id: { $hour: { date: '$order_date', timezone: '+07:00' } },
                    revenue: { $sum: '$total_amount' }
                }}
            ]);
            const hourMap = Object.fromEntries(hourlyData.map(d => [d._id, d.revenue]));
            for (let h = 0; h < 24; h++) {
                chartLabels.push(`${h.toString().padStart(2, '0')}h`);
                chartValues.push(hourMap[h] || 0);
            }
        } else if (period === 'month') {
            const daysInMonth = new Date(year, month, 0).getDate();
            const dailyData = await Order.aggregate([
                { $match: {
                    order_date: { $gte: startDate, $lte: endDate },
                    status: { $in: ['delivered', 'completed'] }
                }},
                { $group: {
                    _id: { $dayOfMonth: { date: '$order_date', timezone: '+07:00' } },
                    revenue: { $sum: '$total_amount' }
                }}
            ]);
            const dayMap = Object.fromEntries(dailyData.map(d => [d._id, d.revenue]));
            for (let d = 1; d <= daysInMonth; d++) {
                chartLabels.push(`${d.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`);
                chartValues.push(dayMap[d] || 0);
            }
        } else if (period === 'quarter') {
            let q = Math.ceil(month / 3);
            if (dateStr && dateStr.includes('-Q')) {
                q = parseInt(dateStr.split('-Q')[1], 10);
            }
            const startMonth = (q - 1) * 3 + 1;
            const monthlyData = await Order.aggregate([
                { $match: {
                    order_date: { $gte: startDate, $lte: endDate },
                    status: { $in: ['delivered', 'completed'] }
                }},
                { $group: {
                    _id: { $month: { date: '$order_date', timezone: '+07:00' } },
                    revenue: { $sum: '$total_amount' }
                }}
            ]);
            const monthMap = Object.fromEntries(monthlyData.map(d => [d._id, d.revenue]));
            for (let m = startMonth; m < startMonth + 3; m++) {
                chartLabels.push(`T${m}`);
                chartValues.push(monthMap[m] || 0);
            }
        } else if (period === 'year') {
            const monthlyData = await Order.aggregate([
                { $match: {
                    order_date: { $gte: startDate, $lte: endDate },
                    status: { $in: ['delivered', 'completed'] }
                }},
                { $group: {
                    _id: { $month: { date: '$order_date', timezone: '+07:00' } },
                    revenue: { $sum: '$total_amount' }
                }}
            ]);
            const monthMap = Object.fromEntries(monthlyData.map(d => [d._id, d.revenue]));
            for (let m = 1; m <= 12; m++) {
                chartLabels.push(`T${m}`);
                chartValues.push(monthMap[m] || 0);
            }
        }

        // Add diagnosis count within the same date range
        const diagnosisCount = await Diagnosis.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        return {
            summary: {
                totalOrders,
                pendingOrders,
                confirmedOrders,
                shippingOrders,
                deliveredOrders,
                cancelledOrders,
                totalRevenue,
                totalCustomers,
                totalProducts,
                taxTotal,
                totalDiagnoses: diagnosisCount
            },
            chart: {
                labels: chartLabels,
                values: chartValues
            }
        };

    }
}

export default AdminStatsService;
