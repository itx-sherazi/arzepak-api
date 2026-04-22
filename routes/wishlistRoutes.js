const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controller/wishlistController');

router.get('/', protect, getWishlist);
router.post('/', protect, addToWishlist);
router.delete('/:propertyId', protect, removeFromWishlist);

module.exports = router;
