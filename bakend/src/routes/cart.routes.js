const router = require('express').Router();
const { body, param } = require('express-validator');
const cartController = require('../controllers/cart.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('Customer', 'Admin'));

router.post(
  '/',
  [body('product_id').isInt({ min: 1 }), body('quantity').isInt({ min: 1 })],
  validate,
  cartController.addToCart
);
router.get('/', cartController.getCart);
router.put(
  '/:id',
  [param('id').isInt({ min: 1 }), body('quantity').isInt({ min: 1 })],
  validate,
  cartController.updateCartItem
);
router.delete('/:id', [param('id').isInt({ min: 1 })], validate, cartController.removeCartItem);

module.exports = router;
