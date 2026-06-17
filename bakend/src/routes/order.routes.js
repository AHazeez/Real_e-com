const router = require('express').Router();
const { body, param } = require('express-validator');
const orderController = require('../controllers/order.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post(
  '/',
  authorize('Customer', 'Admin'),
  [
    body('delivery_address').optional().trim(),
    body('notes').optional().trim(),
    body('payment_method').optional().trim().isLength({ max: 80 })
  ],
  validate,
  orderController.placeOrder
);
router.get('/', authorize('Customer', 'Admin'), orderController.getOrders);
router.get('/:id', authorize('Customer', 'Admin'), [param('id').isInt({ min: 1 })], validate, orderController.getOrderById);
router.put(
  '/:id',
  authorize('Admin'),
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['Pending', 'Confirmed', 'Baking', 'Ready', 'Delivered', 'Cancelled'])
  ],
  validate,
  orderController.updateOrderStatus
);

module.exports = router;
