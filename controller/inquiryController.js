const Inquiry = require('../models/inquiry');
const Property = require('../models/property');
const Dealer = require('../models/dealer');
const Project = require('../models/project');

// POST /api/inquiries
exports.createInquiry = async (req, res) => {
  try {
    const { name, email, phone, message, propertyId, projectId } = req.body;
    if (!name || !email || !phone || !message || (!propertyId && !projectId))
      return res.status(400).json({ success: false, message: 'All fields required' });

    let dealerId = null;
    let finalPropertyId = null;
    let finalProjectId = null;

    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (property) {
        dealerId = property.dealerId;
        finalPropertyId = property._id;
      }
    }

    if (!finalPropertyId && (projectId || propertyId)) {
      const targetId = projectId || propertyId;
      const project = await Project.findById(targetId);
      if (project) {
        finalProjectId = project._id;
      }
    }

    if (!finalPropertyId && !finalProjectId) {
      return res.status(404).json({ success: false, message: 'Target property or project not found' });
    }

    const inquiry = await Inquiry.create({
      name, email, phone, message,
      propertyId: finalPropertyId,
      projectId: finalProjectId,
      dealerId,
      userId: req.user?._id || null,
    });

    // increment dealer leads
    if (dealerId) {
      await Dealer.findByIdAndUpdate(dealerId, { $inc: { totalLeads: 1 } });
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
