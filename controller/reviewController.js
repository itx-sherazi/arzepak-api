const Review = require('../models/review');
const Dealer = require('../models/dealer');

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { dealerId, rating, comment } = req.body;
    const review = await Review.create({ userId: req.user._id, dealerId, rating, comment });

    // Recalculate dealer avg rating
    const stats = await Review.aggregate([
      { $match: { dealerId: review.dealerId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length) {
      await Dealer.findByIdAndUpdate(dealerId, {
        avgRating: Math.round(stats[0].avg * 10) / 10,
        totalReviews: stats[0].count,
      });
    }

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Already reviewed this dealer' });
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/dealer/:dealerId
exports.getDealerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ dealerId: req.params.dealerId })
      .populate('userId', 'name avatar')
      .sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
