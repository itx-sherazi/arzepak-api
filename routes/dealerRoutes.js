const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  registerDealer, getDealers, getDealer,
  getMyProfile, updateMyProfile,
  getMyLeads, updateLeadStatus,
} = require('../controller/dealerController');

// Public
router.get('/', getDealers);
router.get('/:id', getDealer);

// Dealer protected
router.post('/register', protect, registerDealer);
router.get('/me/profile', protect, requireRole('DEALER', 'ADMIN'), getMyProfile);
router.put('/me/profile', protect, requireRole('DEALER', 'ADMIN'), updateMyProfile);
router.get('/me/leads', protect, requireRole('DEALER', 'ADMIN'), getMyLeads);
router.patch('/leads/:id', protect, requireRole('DEALER', 'ADMIN'), updateLeadStatus);

module.exports = router;
