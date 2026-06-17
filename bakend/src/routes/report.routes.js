const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('Admin'));

router.get('/daily', reportController.daily);
router.get('/weekly', reportController.weekly);
router.get('/monthly', reportController.monthly);

module.exports = router;
