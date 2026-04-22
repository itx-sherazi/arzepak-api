const Wishlist = require('../models/wishlist');

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ userId: req.user._id })
      .populate('propertyId', 'title city price images type purpose area areaUnit bedrooms bathrooms status')
      .sort('-createdAt');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const item = await Wishlist.create({ userId: req.user._id, propertyId });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Already in wishlist' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/wishlist/:propertyId
exports.removeFromWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ userId: req.user._id, propertyId: req.params.propertyId });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
