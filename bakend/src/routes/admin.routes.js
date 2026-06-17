const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/stats', authenticate, authorize('Admin'), adminController.getDashboardStats);

module.exports = router;