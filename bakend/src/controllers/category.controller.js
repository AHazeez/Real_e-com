const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const addCategory = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('INSERT INTO categories (category_name) VALUES (?)', [req.body.category_name]);
  res.status(201).json({ success: true, message: 'Category created', data: { id: result.insertId } });
});

const getCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM categories ORDER BY category_name ASC');
  res.json({ success: true, data: rows });
});

const updateCategory = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('UPDATE categories SET category_name = ? WHERE id = ?', [
    req.body.category_name,
    req.params.id
  ]);
  if (!result.affectedRows) throw new AppError('Category not found', 404);
  res.json({ success: true, message: 'Category updated' });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw new AppError('Category not found', 404);
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory
};
