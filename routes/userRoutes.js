const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  register, login, logout, getMe, updateProfile, changePassword, googleAuth,
  forgotPassword,
  resetPassword,
} = require('../controller/authController');

/* ── Validation middleware ── */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/register',         registerRules, validate, register);
router.post('/login',            loginRules,    validate, login);
router.post('/google',           googleAuth);
router.post('/logout',           logout);
router.get('/me',                protect, getMe);
router.put('/profile',           protect, updateProfile);
router.put('/change-password',   protect, changePassword);
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);


module.exports = router;
