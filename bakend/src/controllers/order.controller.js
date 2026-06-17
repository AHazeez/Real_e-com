const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const createOrderNumber = require('../utils/orderNumber');
const erpSalesService = require('../services/erp/sales.service');

const placeOrder = asyncHandler(async (req, res) => {
  const { delivery_address, notes, payment_method } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [cartItems] = await connection.execute(
      `SELECT c.product_id, c.quantity, p.name, p.price, p.stock_quantity
       FROM carts c
       INNER JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ? AND p.status = 'active'
       FOR UPDATE`,
      [req.user.id]
    );

    if (!cartItems.length) throw new AppError('Cart is empty', 400);

    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.name}`, 400);
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const taxAmount = 0;
    const deliveryFee = 0;
    const totalAmount = subtotal + taxAmount + deliveryFee;
    const orderNumber = createOrderNumber();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, order_number, subtotal, tax_amount, delivery_fee, total_amount, delivery_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, orderNumber, subtotal, taxAmount, deliveryFee, totalAmount, delivery_address || null, notes || null]
    );

    for (const item of cartItems) {
      const lineTotal = Number(item.price) * item.quantity;
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.product_id, item.name, item.quantity, item.price, lineTotal]
      );
      await connection.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
      await connection.execute(
        'UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.execute(
      'INSERT INTO payments (order_id, payment_method, amount) VALUES (?, ?, ?)',
      [orderResult.insertId, payment_method || 'COD', totalAmount]
    );
    await connection.execute('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
    await connection.commit();

    erpSalesService.queueSalesOrderSync({ orderId: orderResult.insertId, orderNumber }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { id: orderResult.insertId, order_number: orderNumber, total_amount: totalAmount }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'Admin';
  const [rows] = await pool.execute(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     ${isAdmin ? '' : 'WHERE o.user_id = ?'}
     ORDER BY o.created_at DESC`,
    isAdmin ? [] : [req.user.id]
  );
  res.json({ success: true, data: rows });
});

const getOrderById = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'Admin';
  const [orders] = await pool.execute(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
            p.payment_method, p.status AS payment_status
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.id = ? ${isAdmin ? '' : 'AND o.user_id = ?'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!orders.length) throw new AppError('Order not found', 404);

  const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
  res.json({ success: true, data: { ...orders[0], items } });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  if (!result.affectedRows) throw new AppError('Order not found', 404);
  res.json({ success: true, message: 'Order status updated' });
});

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};
