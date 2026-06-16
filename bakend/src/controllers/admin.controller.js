const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const [[products]] = await pool.execute('SELECT COUNT(*) AS total_products FROM products');
  const [[orders]] = await pool.execute('SELECT COUNT(*) AS total_orders FROM orders');
  const [[customers]] = await pool.execute(
    `SELECT COUNT(*) AS total_customers
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'Customer'`
  );
  const [[revenue]] = await pool.execute(
    "SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status != 'Cancelled'"
  );
  const [[lowStock]] = await pool.execute(
    'SELECT COUNT(*) AS low_stock_count FROM inventory WHERE stock_quantity <= reorder_level'
  );

  res.json({
    success: true,
    data: {
      total_products: products.total_products,
      total_orders: orders.total_orders,
      total_customers: customers.total_customers,
      total_revenue: revenue.total_revenue,
      low_stock_count: lowStock.low_stock_count
    }
  });
});

module.exports = {
  getDashboard
};
