const router = require('express').Router();
const { body } = require('express-validator');
const settingsController = require('../controllers/settings.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('Admin'));

router.get('/', settingsController.getSettings);
router.put(
  '/',
  [
    body('company_name').trim().isLength({ min: 2, max: 180 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().isLength({ min: 3, max: 30 }),
    body('address').trim().isLength({ min: 3, max: 500 }),
    body('instagram').optional({ checkFalsy: true }).isURL(),
    body('facebook').optional({ checkFalsy: true }).isURL(),
    body('twitter').optional({ checkFalsy: true }).isURL(),
    body('delivery_fee').isFloat({ min: 0 })
  ],
  validate,
  settingsController.updateSettings
);

module.exports = router;
