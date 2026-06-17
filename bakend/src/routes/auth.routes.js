const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, logout } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 120 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('phone').optional().trim().isLength({ max: 30 })
  ],
  validate,
  register
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post('/logout', authenticate, logout);

module.exports = router;
