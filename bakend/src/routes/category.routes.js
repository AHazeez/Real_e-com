const router = require('express').Router();
const { body, param } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post(
  '/',
  authenticate,
  authorize('Admin'),
  [body('category_name').trim().isLength({ min: 2, max: 120 })],
  validate,
  categoryController.addCategory
);
router.get('/', categoryController.getCategories);
router.put(
  '/:id',
  authenticate,
  authorize('Admin'),
  [param('id').isInt({ min: 1 }), body('category_name').trim().isLength({ min: 2, max: 120 })],
  validate,
  categoryController.updateCategory
);
router.delete(
  '/:id',
  authenticate,
  authorize('Admin'),
  [param('id').isInt({ min: 1 })],
  validate,
  categoryController.deleteCategory
);

module.exports = router;
