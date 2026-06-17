const router = require('express').Router();
const { body } = require('express-validator');
const customerController = require('../controllers/customer.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorize('Admin'), customerController.getCustomers);
router.get('/profile', authenticate, authorize('Customer', 'Admin'), customerController.getProfile);
router.put(
  '/profile',
  authenticate,
  authorize('Customer', 'Admin'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 120 }),
    body('phone').optional().trim().isLength({ max: 30 }),
    body('address_line1').optional().trim().isLength({ max: 255 }),
    body('address_line2').optional().trim().isLength({ max: 255 }),
    body('city').optional().trim().isLength({ max: 100 }),
    body('state').optional().trim().isLength({ max: 100 }),
    body('postal_code').optional().trim().isLength({ max: 20 }),
    body('country').optional().trim().isLength({ max: 100 })
  ],
  validate,
  customerController.updateProfile
);

module.exports = router;
