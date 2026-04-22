const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createReview, getDealerReviews } = require('../controller/reviewController');

router.get('/dealer/:dealerId', getDealerReviews);
router.post('/', protect, createReview);

module.exports = router;
