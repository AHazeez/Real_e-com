const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getCustomers = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT c.id,
            u.id AS user_id,
            u.name,
            u.email,
            u.phone,
            CONCAT_WS(', ', c.address_line1, c.address_line2, c.city, c.state, c.postal_code, c.country) AS address,
            c.created_at AS join_date,
            COUNT(o.id) AS order_count,
            COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spent,
            MAX(o.created_at) AS last_order_date
     FROM customers c
     INNER JOIN users u ON u.id = c.user_id
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY c.id, u.id, u.name, u.email, u.phone, c.address_line1, c.address_line2, c.city, c.state, c.postal_code, c.country, c.created_at
     ORDER BY c.created_at DESC`
  );

  res.json({ success: true, data: rows });
});

const getProfile = asyncHandler(async (req, res) => {
  const [profile] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.phone, c.address_line1, c.address_line2, c.city, c.state, c.postal_code, c.country
     FROM users u
     LEFT JOIN customers c ON c.user_id = u.id
     WHERE u.id = ?`,
    [req.user.id]
  );

  const [orders] = await pool.execute(
    'SELECT id, order_number, status, total_amount, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );

  res.json({ success: true, data: { profile: profile[0], orders } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address_line1, address_line2, city, state, postal_code, country } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?',
      [name || null, phone || null, req.user.id]
    );
    await connection.execute(
      `UPDATE customers
       SET address_line1 = COALESCE(?, address_line1),
           address_line2 = COALESCE(?, address_line2),
           city = COALESCE(?, city),
           state = COALESCE(?, state),
           postal_code = COALESCE(?, postal_code),
           country = COALESCE(?, country)
       WHERE user_id = ?`,
      [address_line1 || null, address_line2 || null, city || null, state || null, postal_code || null, country || null, req.user.id]
    );
    await connection.commit();
    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = {
  getCustomers,
  getProfile,
  updateProfile
};
