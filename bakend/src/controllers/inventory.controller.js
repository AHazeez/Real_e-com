const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const erpInventoryService = require('../services/erp/inventory.service');

const getInventory = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT i.id, i.product_id, p.name AS product_name, i.stock_quantity, i.reorder_level,
            CASE WHEN i.stock_quantity <= i.reorder_level THEN 1 ELSE 0 END AS low_stock
     FROM inventory i
     INNER JOIN products p ON p.id = i.product_id
     ORDER BY low_stock DESC, p.name ASC`
  );
  res.json({ success: true, data: rows });
});

const updateInventory = asyncHandler(async (req, res) => {
  const { stock_quantity, reorder_level } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE inventory
       SET stock_quantity = COALESCE(?, stock_quantity),
           reorder_level = COALESCE(?, reorder_level)
       WHERE id = ?`,
      [stock_quantity ?? null, reorder_level ?? null, req.params.id]
    );
    if (!result.affectedRows) throw new AppError('Inventory item not found', 404);

    if (stock_quantity !== undefined) {
      await connection.execute(
        `UPDATE products p
         INNER JOIN inventory i ON i.product_id = p.id
         SET p.stock_quantity = ?
         WHERE i.id = ?`,
        [stock_quantity, req.params.id]
      );
    }

    await connection.commit();
    erpInventoryService.queueInventorySync({ inventoryId: req.params.id }).catch(() => {});
    res.json({ success: true, message: 'Inventory updated' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = {
  getInventory,
  updateInventory
};
