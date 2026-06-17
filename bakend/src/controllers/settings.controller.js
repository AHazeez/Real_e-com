const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getSettings = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT company_name, email, phone, address, instagram, facebook, twitter, delivery_fee
     FROM app_settings
     WHERE id = 1`
  );

  res.json({ success: true, data: rows[0] || null });
});

const updateSettings = asyncHandler(async (req, res) => {
  const {
    company_name,
    email,
    phone,
    address,
    instagram,
    facebook,
    twitter,
    delivery_fee
  } = req.body;

  await pool.execute(
    `INSERT INTO app_settings
     (id, company_name, email, phone, address, instagram, facebook, twitter, delivery_fee)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       company_name = VALUES(company_name),
       email = VALUES(email),
       phone = VALUES(phone),
       address = VALUES(address),
       instagram = VALUES(instagram),
       facebook = VALUES(facebook),
       twitter = VALUES(twitter),
       delivery_fee = VALUES(delivery_fee)`,
    [
      company_name,
      email,
      phone,
      address,
      instagram || null,
      facebook || null,
      twitter || null,
      delivery_fee || 0
    ]
  );

  res.json({ success: true, message: 'Settings updated' });
});

module.exports = {
  getSettings,
  updateSettings
};
