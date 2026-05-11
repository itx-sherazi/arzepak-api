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
    type:        { type: String, enum: ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'FARMHOUSE', 'ROOM', 'UPPER_PORTION', 'LOWER_PORTION', 'PENTHOUSE', 'RESIDENTIAL_PLOT', 'COMMERCIAL_PLOT', 'AGRICULTURAL', 'INDUSTRIAL_LAND', 'PLOT_FILE', 'PLOT_FORM', 'OFFICE', 'SHOP', 'WAREHOUSE', 'FACTORY', 'BUILDING', 'OTHER'], required: true },
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
    videoUrl:        { type: String, trim: true },
    videoUrls:       [{ type: String, trim: true }],
    contactEmail:    { type: String, trim: true },
    contactMobiles:  [{ type: String, trim: true }],
    contactLandline: { type: String, trim: true },
    amenities:   [{ type: String }],
    features: {
      flooring:               { type: String },
      electricityBackup:      { type: String },
      otherMainFeatures:      { type: String },
      builtYear:              { type: Number },
      parkingSpaces:          { type: Number },
      floors:                 { type: Number },
      centralAirConditioning: { type: Boolean },
      centralHeating:         { type: Boolean },
      wasteDisposal:          { type: Boolean },
      elevatorOrLift:         { type: Boolean },
      otherRooms:             { type: Number },
      rooms:                  { type: Number },
      otherBizComm:           { type: String },
      broadbandInternet:      { type: Boolean },
      satelliteOrCableTv:     { type: Boolean },
      nearbySchools:          { type: Number },
      nearbyHospitals:        { type: Number },
      nearbyShoppingMalls:    { type: Number },
      nearbyRestaurants:      { type: Number },
      distanceFromAirport:    { type: Number },
      nearbyPublicTransport:  { type: Number },
      otherNearbyPlaces:      { type: String },
      otherFacilities:        { type: String },
      maintenanceStaff:       { type: Boolean },
      securityStaff:          { type: Boolean },
    },
    installmentAvailable: { type: Boolean, default: false },
    advanceAmount:        { type: Number },
    noOfInstallments:     { type: Number },
    monthlyInstallment:   { type: Number },
    balloonPayment:       { type: Boolean, default: false },
    balloonAmount:        { type: Number },
    noOfBalloonPayments:  { type: Number },
    ballotingFee:         { type: Number },
    possessionFee:        { type: Number },
    developmentFee:       { type: Number },
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
propertySchema.index({ title: 'text', description: 'text', areaName: 'text', city: 'text' });

module.exports = mongoose.model('Property', propertySchema);
