const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const salesReport = (periodSql) => asyncHandler(async (req, res) => {
  const [sales] = await pool.execute(
    `SELECT DATE(created_at) AS sales_date,
            COUNT(*) AS total_orders,
            COALESCE(SUM(total_amount), 0) AS total_sales
     FROM orders
     WHERE status != 'Cancelled' AND ${periodSql}
     GROUP BY DATE(created_at)
     ORDER BY sales_date DESC`
  );

  const [topProducts] = await pool.execute(
    `SELECT product_id, product_name, SUM(quantity) AS quantity_sold, SUM(line_total) AS revenue
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE o.status != 'Cancelled' AND ${periodSql.replace(/created_at/g, 'o.created_at')}
     GROUP BY product_id, product_name
     ORDER BY quantity_sold DESC
     LIMIT 10`
  );

  res.json({ success: true, data: { sales, top_selling_products: topProducts } });
});

module.exports = {
  daily: salesReport('created_at >= CURDATE()'),
  weekly: salesReport('created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'),
  monthly: salesReport('created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)')
};
