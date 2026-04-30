const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  name:      { type: String },
  minPrice:  { type: Number },
  maxPrice:  { type: Number },
  minArea:   { type: Number },
  maxArea:   { type: Number },
  areaUnit:  { type: String, default: 'MARLA' },
  bedrooms:  { type: Number },
  bathrooms: { type: Number },
}, { _id: false });

const updateSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  content: { type: String },
  image:   { type: String },
  date:    { type: Date, default: Date.now },
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title:       { type: String, trim: true },
  slug:        { type: String, required: true, lowercase: true, trim: true },
  city:        { type: String },
  address:     { type: String },
  description: { type: String },
  developer:   { type: String },
  marketedBy:  { type: String },
  minPrice:    { type: Number },
  maxPrice:    { type: Number },
  totalUnits:  { type: Number },
  completionDate: { type: String },
  offering:    [{ type: String }],          // e.g. ["Flats", "Shops"]
  amenities:   [{ type: String }],
  features: {
    mainFeatures:     [{ type: String }],
    plotFeatures:     [{ type: String }],
    businessComm:     [{ type: String }],
    nearbyFacilities: [{ type: String }],
    otherFacilities:  [{ type: String }],
  },
  logo:         { type: String },            // Project logo Cloudinary URL
  images:       [{ type: String }],         // Cloudinary URLs
  galleries:    [{ title: String, images: [String] }], // Named image galleries
  floorPlans:   [{ label: String, image: String }],
  paymentPlan:  { type: String },           // legacy single image (kept for compat)
  paymentPlans: [{ label: String, image: String }], // multiple payment plan cards
  units:        [unitSchema],
  updates:      [updateSchema],
  latitude:     { type: Number },
  longitude:    { type: Number },
  /** Google Maps embed URL (Share → Embed) or any https maps link */
  mapUrl:       { type: String, trim: true },
  /** Optional intro text for the Nearby tab on the project page */
  nearbyNote:   { type: String, trim: true },
  /** Rows shown under Nearby (label + optional custom Maps URL; if URL empty, search uses label + address) */
  nearbyItems:  [{
    label:   { type: String, required: true, trim: true },
    mapsUrl: { type: String, trim: true },
  }, { _id: false }],
 
  status:       { type: String, enum: ['DRAFT','BOOKING_OPEN','UNDER_CONSTRUCTION','LAUNCHING_SOON','COMPLETED','SOLD_OUT'], default: 'BOOKING_OPEN' },
  isFeatured:   { type: Boolean, default: false },
  addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, { timestamps: true });

projectSchema.index({ slug: 1 }, { unique: true });
projectSchema.index({ city: 1, status: 1 });
projectSchema.index({ isFeatured: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);
