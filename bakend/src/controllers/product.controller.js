const pool = require('../config/db');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const imageUrlFromRequest = (req) => {
  if (!req.file) return undefined;
  return `${env.uploadsBaseUrl}/products/${req.file.filename}`;
};

const addProduct = asyncHandler(async (req, res) => {
  const imageUrl = imageUrlFromRequest(req);
  const { name, description, price, category, category_id, stock_quantity, status, reorder_level } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO products (name, description, price, category, category_id, stock_quantity, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        price,
        category || null,
        category_id || null,
        stock_quantity || 0,
        imageUrl || null,
        status || 'active'
      ]
    );
    await connection.execute(
      'INSERT INTO inventory (product_id, stock_quantity, reorder_level) VALUES (?, ?, ?)',
      [result.insertId, stock_quantity || 0, reorder_level || 5]
    );
    await connection.commit();

    res.status(201).json({ success: true, message: 'Product created', data: { id: result.insertId } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const getProducts = asyncHandler(async (req, res) => {
  const conditions = [];
  const params = [];

  if (req.query.status) {
    conditions.push('p.status = ?');
    params.push(req.query.status);
  }

  if (req.query.low_stock === 'true') {
    conditions.push('i.stock_quantity <= i.reorder_level');
  }

  const limit = Number(req.query.limit);
  const limitSql = Number.isInteger(limit) && limit > 0 ? ` LIMIT ${Math.min(limit, 100)}` : '';

  const [rows] = await pool.execute(
    `SELECT p.*, i.reorder_level
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY p.created_at DESC${limitSql}`,
    params
  );
  res.json({ success: true, data: rows });
});

const getProductById = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT p.*, i.reorder_level
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.id = ?`,
    [req.params.id]
  );
  if (!rows.length) throw new AppError('Product not found', 404);
  res.json({ success: true, data: rows[0] });
});

const updateProduct = asyncHandler(async (req, res) => {
  const current = await pool.execute('SELECT id FROM products WHERE id = ?', [req.params.id]);
  if (!current[0].length) throw new AppError('Product not found', 404);

  const imageUrl = imageUrlFromRequest(req);
  const { name, description, price, category, category_id, stock_quantity, status, reorder_level } = req.body;

  await pool.execute(
    `UPDATE products
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         price = COALESCE(?, price),
         category = COALESCE(?, category),
         category_id = COALESCE(?, category_id),
         stock_quantity = COALESCE(?, stock_quantity),
         image_url = COALESCE(?, image_url),
         status = COALESCE(?, status)
     WHERE id = ?`,
    [
      name || null,
      description || null,
      price || null,
      category || null,
      category_id || null,
      stock_quantity ?? null,
      imageUrl || null,
      status || null,
      req.params.id
    ]
  );

  if (stock_quantity !== undefined || reorder_level !== undefined) {
    await pool.execute(
      `UPDATE inventory
       SET stock_quantity = COALESCE(?, stock_quantity),
           reorder_level = COALESCE(?, reorder_level)
       WHERE product_id = ?`,
      [stock_quantity ?? null, reorder_level ?? null, req.params.id]
    );
  }

  res.json({ success: true, message: 'Product updated' });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('UPDATE products SET status = ? WHERE id = ?', ['inactive', req.params.id]);
  if (!result.affectedRows) throw new AppError('Product not found', 404);
  res.json({ success: true, message: 'Product removed from storefront' });
});

module.exports = {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
