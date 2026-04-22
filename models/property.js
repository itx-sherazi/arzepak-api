const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    // Slug is optional, but when present it must be unique.
    // We enforce uniqueness via a partial unique index (below) so multiple
    // documents without a slug don't collide on `null`.
    slug:        { type: String, lowercase: true, trim: true },
    description: { type: String, required: true },
    purpose:     { type: String, enum: ['SALE', 'RENT'], required: true },
    type:        { type: String, enum: ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'FARMHOUSE', 'ROOM'], required: true },
    price:       { type: Number, required: true },
    area:        { type: Number, required: true },
    areaUnit:    { type: String, enum: ['MARLA', 'KANAL', 'SQFT', 'SQYD'], default: 'MARLA' },
    bedrooms:    { type: Number },
    bathrooms:   { type: Number },
    floors:      { type: Number },
    furnishing:  { type: String, enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED'] },
    buildYear:   { type: Number },
    city:        { type: String, required: true },
    areaName:    { type: String, required: true },
    address:     { type: String },
    latitude:    { type: Number },
    longitude:   { type: Number },
    // Images are stored as objects: { url, publicId }.
    // Backwards compatibility: older records may contain string URLs; controllers normalize both shapes.
    images:      { type: [mongoose.Schema.Types.Mixed], default: [] },
    amenities:   [{ type: String }],
    status:      { type: String, enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'SOLD', 'RENTED'], default: 'PENDING' },
    isFeatured:  { type: Boolean, default: false },
    isSponsored: { type: Boolean, default: false },
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dealerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Unique only when slug is a non-empty string.
propertySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: 'string' } } }
);
propertySchema.index({ city: 1, status: 1, purpose: 1 });
propertySchema.index({ type: 1, status: 1 });
propertySchema.index({ dealerId: 1, status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ isFeatured: 1, status: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ city: 1, areaName: 1, status: 1 });

module.exports = mongoose.model('Property', propertySchema);
