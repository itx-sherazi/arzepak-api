const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createInquiry, myInquiries } = require('../controller/inquiryController');

router.post('/', createInquiry);                 // public (guest or logged-in)
router.get('/my', protect, myInquiries);

module.exports = router;
