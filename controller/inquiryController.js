const Inquiry = require('../models/inquiry');
const Property = require('../models/property');
const Dealer = require('../models/dealer');

// POST /api/inquiries
exports.createInquiry = async (req, res) => {
  try {
    const { name, email, phone, message, propertyId } = req.body;
    if (!name || !email || !phone || !message || !propertyId)
      return res.status(400).json({ success: false, message: 'All fields required' });

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const inquiry = await Inquiry.create({
      name, email, phone, message, propertyId,
      dealerId: property.dealerId || null,
      userId: req.user?._id || null,
    });

    // increment dealer leads
    if (property.dealerId) {
      await Dealer.findByIdAndUpdate(property.dealerId, { $inc: { totalLeads: 1 } });
    }

    res.status(201).json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/inquiries/my — user sent inquiries
exports.myInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ userId: req.user._id })
      .populate('propertyId', 'title city images price')
      .sort('-createdAt');
    res.json({ success: true, data: inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
