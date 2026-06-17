const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [productsResult] = await connection.execute(
            `SELECT COUNT(p.id) as totalProducts,
                    SUM(CASE WHEN i.stock_quantity <= i.reorder_level THEN 1 ELSE 0 END) as lowStockCount
             FROM products p
             LEFT JOIN inventory i ON i.product_id = p.id`
        );
        const [ordersResult] = await connection.execute('SELECT COUNT(*) as totalOrders, SUM(total_amount) as totalRevenue FROM orders');
        const [customersResult] = await connection.execute('SELECT COUNT(*) as totalCustomers FROM customers');

        res.json({
            success: true,
            data: {
                totalProducts: productsResult[0].totalProducts || 0,
                lowStockCount: productsResult[0].lowStockCount || 0,
                totalOrders: ordersResult[0].totalOrders || 0,
                totalRevenue: parseFloat(ordersResult[0].totalRevenue) || 0,
                totalCustomers: customersResult[0].totalCustomers || 0,
            }
        });
    } finally {
        connection.release();
    }
});

module.exports = {
    getDashboardStats
};
