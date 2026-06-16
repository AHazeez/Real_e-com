const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) throw new AppError('Email is already registered', 409);

  const [roles] = await pool.execute('SELECT id FROM roles WHERE name = ?', ['Customer']);
  if (!roles.length) throw new AppError('Customer role is not configured', 500);

  const passwordHash = await hashPassword(password);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      'INSERT INTO users (role_id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)',
      [roles[0].id, name, email, passwordHash, phone || null]
    );
    await connection.execute('INSERT INTO customers (user_id) VALUES (?)', [userResult.insertId]);
    await connection.commit();

    const token = signToken({ id: userResult.insertId, role: 'Customer' });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { token, user: { id: userResult.insertId, name, email, role: 'Customer' } }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.password_hash, u.status, r.name AS role
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email]
  );

  if (!rows.length) throw new AppError('Invalid email or password', 401);
  const user = rows[0];
  if (user.status !== 'active') throw new AppError('User account is inactive', 403);

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) throw new AppError('Invalid email or password', 401);

  await pool.execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

  const token = signToken({ id: user.id, role: user.role });
  res.json({
    success: true,
    message: 'Login successful',
    data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logout successful. Remove the token on the client.' });
});

module.exports = {
  register,
  login,
  logout
};
