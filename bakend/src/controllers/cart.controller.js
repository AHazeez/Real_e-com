const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const addToCart = asyncHandler(async (req, res) => {
  const { product_id, quantity } = req.body;
  const [products] = await pool.execute('SELECT id, stock_quantity, status FROM products WHERE id = ?', [product_id]);
  if (!products.length || products[0].status !== 'active') throw new AppError('Product is unavailable', 404);

  const [existingCartItems] = await pool.execute(
    'SELECT quantity FROM carts WHERE user_id = ? AND product_id = ?',
    [req.user.id, product_id]
  );
  const currentQuantity = existingCartItems[0]?.quantity || 0;
  if (products[0].stock_quantity < currentQuantity + quantity) {
    throw new AppError('Requested quantity exceeds available stock', 400);
  }

  await pool.execute(
    `INSERT INTO carts (user_id, product_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [req.user.id, product_id, quantity]
  );

  res.status(201).json({ success: true, message: 'Item added to cart' });
});

const getCart = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT c.id, c.product_id, p.name, p.price, p.image_url, c.quantity, (p.price * c.quantity) AS line_total
     FROM carts c
     INNER JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  const total = rows.reduce((sum, item) => sum + Number(item.line_total), 0);
  res.json({ success: true, data: { items: rows, total } });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const [cartItems] = await pool.execute(
    `SELECT c.product_id, p.stock_quantity
     FROM carts c
     INNER JOIN products p ON p.id = c.product_id
     WHERE c.id = ? AND c.user_id = ?`,
    [req.params.id, req.user.id]
  );
  if (!cartItems.length) throw new AppError('Cart item not found', 404);
  if (cartItems[0].stock_quantity < req.body.quantity) {
    throw new AppError('Requested quantity exceeds available stock', 400);
  }

  const [result] = await pool.execute('UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?', [
    req.body.quantity,
    req.params.id,
    req.user.id
  ]);
  if (!result.affectedRows) throw new AppError('Cart item not found', 404);
  res.json({ success: true, message: 'Cart item updated' });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM carts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) throw new AppError('Cart item not found', 404);
  res.json({ success: true, message: 'Cart item removed' });
});

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem
};
