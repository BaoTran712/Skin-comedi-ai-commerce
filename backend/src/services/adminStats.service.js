// backend/src/services/adminStats.service.js

import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Diagnosis from '../models/diagnosis.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
// Models Coupon and Banner were removed as they are not used and the files don't exist

/**
 * Service responsible for gathering dashboard statistics for the admin panel.
 * All numbers are calculated in real‑time using MongoDB aggregation pipelines.
 */
class AdminStatsService {
  /**
   * Get a comprehensive set of statistics for the admin dashboard.
   * Returns an object containing all KPI values required by the front‑end.
   */
  async getDashboardStats() {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      totalCustomers,
      newCustomers,
      returningCustomers,
      totalProducts,
      totalCategories,
      totalBrands,
      outOfStockProducts,
      lowStockProducts,
      todayAIDiagnoses,
      monthAIDiagnoses,
      totalAIDiagnoses,
      topSellingProduct,
      topSellingCategory,
      topCustomer,
    ] = await Promise.all([
      // Order counts
      Order.countDocuments({}),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'confirmed' }),
      Order.countDocuments({ status: 'shipping' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      // Revenue – sum of order totalPrice for completed orders
      Order.aggregate([
        { $match: { status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        { $project: { _id: 0, total: 1 } },
      ]).then(res => (res[0] ? res[0].total : 0)),
      // Customer metrics
      User.countDocuments({ role: 'customer' }),
      // New customers: created in the last 30 days
      User.countDocuments({ role: 'customer', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      // Returning customers: customers with more than one order
      Order.aggregate([
        { $match: { status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: '$customerId', orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gt: 1 } } },
        { $count: 'returning' },
      ]).then(res => (res[0] ? res[0].returning : 0)),
      // Product metrics
      Product.countDocuments({}),
      Category.countDocuments({}),
      Brand.countDocuments({}),
      // Out of stock products (quantity <= 0)
      Product.countDocuments({ quantity: { $lte: 0 } }),
      // Low stock (< 10)
      Product.countDocuments({ quantity: { $gt: 0, $lt: 10 } }),
      // AI Diagnoses – assuming a Diagnosis model with createdAt field
      Diagnosis.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
      Diagnosis.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } }),
      Diagnosis.countDocuments({}),
      // Top selling product – based on orderDetail quantity
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', sold: { $sum: '$items.quantity' } } },
        { $sort: { sold: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { _id: 0, productId: '$_id', name: '$product.title', sold: 1 } },
      ]).then(res => (res[0] ? res[0] : null)),
      // Top selling category – similar logic but group by product.categoryId
      Order.aggregate([
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'prod' } },
        { $unwind: 'prod' },
        { $group: { _id: '$prod.categoryId', sold: { $sum: '$items.quantity' } } },
        { $sort: { sold: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
        { $unwind: 'cat' },
        { $project: { _id: 0, categoryId: '$_id', name: '$cat.name', sold: 1 } },
      ]).then(res => (res[0] ? res[0] : null)),
      // Top customer – based on total spend
      Order.aggregate([
        { $match: { status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: '$customerId', spent: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
        { $sort: { spent: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: 'user' },
        { $project: { _id: 0, customerId: '$_id', name: '$user.fullName', email: '$user.email', spent: 1, orders: 1 } },
      ]).then(res => (res[0] ? res[0] : null)),
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      totalCustomers,
      newCustomers,
      returningCustomers,
      totalProducts,
      totalCategories,
      totalBrands,
      outOfStockProducts,
      lowStockProducts,
      todayAIDiagnoses,
      monthAIDiagnoses,
      totalAIDiagnoses,
      topSellingProduct,
      topSellingCategory,
      topCustomer,
    };
  }
}

export default AdminStatsService;
