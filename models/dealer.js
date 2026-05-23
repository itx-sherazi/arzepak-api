const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    agencyName:    { type: String },
    companyEmail:  { type: String },
    address:       { type: String },
    cnic:          { type: String },
    cnicDoc:       { type: String },   // Cloudinary URL
    licenseDoc:    { type: String },   // Cloudinary URL
    bio:           { type: String },
    whatsapp:      { type: String },
    phone:         { type: String },
    city:          { type: String, required: true },
    areasServed:   [{ type: String }],
    logo:          { type: String },   // Cloudinary URL
    experience:    { type: Number, default: 0 },
    isVerified:    { type: Boolean, default: false },
    status:        { type: String, enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'], default: 'PENDING' },
    package:       { type: String, enum: ['BASIC', 'STANDARD', 'PREMIUM'], default: 'BASIC' },
    packageExpiry: { type: Date },
    // stats (denormalised for perf)
    totalListings: { type: Number, default: 0 },
    totalLeads:    { type: Number, default: 0 },
    totalViews:    { type: Number, default: 0 },
    avgRating:     { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

dealerSchema.index({ city: 1, status: 1 });

module.exports = mongoose.model('Dealer', dealerSchema);
