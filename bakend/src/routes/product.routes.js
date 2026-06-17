const router = require('express').Router();
const { body, param } = require('express-validator');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadProductImage } = require('../middleware/upload.middleware');

const createProductValidation = [
  body('name').trim().isLength({ min: 2, max: 180 }),
  body('description').optional().trim(),
  body('price').isFloat({ min: 0 }),
  body('category').optional().trim().isLength({ max: 120 }),
  body('category_id').optional().isInt({ min: 1 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('reorder_level').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive'])
];

const updateProductValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 180 }),
  body('description').optional().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().trim().isLength({ max: 120 }),
  body('category_id').optional().isInt({ min: 1 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('reorder_level').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive'])
];

router.post('/', authenticate, authorize('Admin'), uploadProductImage, createProductValidation, validate, productController.addProduct);
router.get('/', productController.getProducts);
router.get('/:id', [param('id').isInt({ min: 1 })], validate, productController.getProductById);
router.put(
  '/:id',
  authenticate,
  authorize('Admin'),
  uploadProductImage,
  [param('id').isInt({ min: 1 }), ...updateProductValidation],
  validate,
  productController.updateProduct
);
router.delete('/:id', authenticate, authorize('Admin'), [param('id').isInt({ min: 1 })], validate, productController.deleteProduct);

module.exports = router;
