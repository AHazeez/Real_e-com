const router = require('express').Router();
const { body, param } = require('express-validator');
const inventoryController = require('../controllers/inventory.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('Admin'));

router.get('/', inventoryController.getInventory);
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }),
    body('stock_quantity').optional().isInt({ min: 0 }),
    body('reorder_level').optional().isInt({ min: 0 })
  ],
  validate,
  inventoryController.updateInventory
);

module.exports = router;
