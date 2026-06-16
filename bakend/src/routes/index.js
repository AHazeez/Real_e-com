const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/categories', require('./category.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/inventory', require('./inventory.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
