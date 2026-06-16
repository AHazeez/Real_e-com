const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw new AppError('Authentication token is required', 401);

  const decoded = verifyToken(token);
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.status, r.name AS role
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [decoded.id]
  );

  if (!rows.length || rows[0].status !== 'active') {
    throw new AppError('Invalid or inactive user', 401);
  }

  req.user = rows[0];
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  return next();
};

module.exports = {
  authenticate,
  authorize
};
