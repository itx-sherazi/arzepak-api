const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ dealerId: 1 });
reviewSchema.index({ userId: 1, dealerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
