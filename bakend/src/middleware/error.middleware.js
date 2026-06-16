const env = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message
  };

  if (err.details) response.details = err.details;
  if (env.nodeEnv !== 'production') response.stack = err.stack;

  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler
};
