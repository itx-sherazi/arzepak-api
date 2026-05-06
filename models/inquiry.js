const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    email:      { type: String, required: true },
    phone:      { type: String, required: true },
    message:    { type: String, required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    projectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    dealerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:     { type: String, enum: ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'], default: 'NEW' },
  },
  { timestamps: true }
);

inquirySchema.index({ dealerId: 1, status: 1, createdAt: -1 });
inquirySchema.index({ propertyId: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
