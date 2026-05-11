const Inquiry  = require('../models/inquiry');
const Property = require('../models/property');
const Dealer   = require('../models/dealer');
const Project  = require('../models/project');

/* POST /api/inquiries */
exports.createInquiry = async (req, res) => {
  try {
    const { name, email, phone, message, propertyId, projectId } = req.body;

    let dealerId        = null;
    let finalPropertyId = null;
    let finalProjectId  = null;

    if (propertyId) {
      const property = await Property.findById(propertyId).select('_id dealerId').lean();
      if (property) { dealerId = property.dealerId; finalPropertyId = property._id; }
    }

    if (projectId) {
      const project = await Project.findById(projectId).select('_id').lean();
      if (project) finalProjectId = project._id;
    }

    if (!finalPropertyId && !finalProjectId)
      return res.status(404).json({ success: false, message: 'Target property or project not found' });

    const inquiry = await Inquiry.create({
      name, email: email || '', phone, message: message || '',
      propertyId: finalPropertyId,
      projectId:  finalProjectId,
      dealerId,
      userId: req.user?._id || null,
    });

    if (dealerId) Dealer.findByIdAndUpdate(dealerId, { $inc: { totalLeads: 1 } }).catch(() => {});

    res.status(201).json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/inquiries/my — with pagination */
exports.myInquiries = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      Inquiry.find({ userId: req.user._id })
        .populate('propertyId', 'title city images price slug')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ success: true, data: inquiries, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
