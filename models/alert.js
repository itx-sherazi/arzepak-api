const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    city:     { type: String },
    type:     { type: String },
    purpose:  { type: String },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    minArea:  { type: Number },
    maxArea:  { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
