const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { createInquiry, myInquiries } = require('../controller/inquiryController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  next();
};

const inquiryRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ min: 7, max: 20 }).withMessage('Invalid phone number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email').normalizeEmail(),
  body('message').optional().isLength({ max: 2000 }).withMessage('Message too long'),
];

router.post('/', inquiryRules, validate, createInquiry);
router.get('/my', protect, myInquiries);

module.exports = router;
