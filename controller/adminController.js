const User = require('../models/user');
const Dealer = require('../models/dealer');
const Property = require('../models/property');
const Inquiry = require('../models/inquiry');
const { deleteImagesByRefs, normalizeImageRefs } = require('./uploadController');

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [
      totalDealers, totalProperties,
      activeListings, pendingListings, totalInquiries,
      pendingDealers,
      recentListings,
    ] = await Promise.all([
      Dealer.countDocuments(),
      Property.countDocuments(),
      Property.countDocuments({ status: 'ACTIVE' }),
      Property.countDocuments({ status: 'PENDING' }),
      Inquiry.countDocuments(),
      Dealer.countDocuments({ status: 'PENDING' }),
      Property.find({ status: 'PENDING' }).sort('-createdAt').limit(5)
        .populate('dealerId', 'agencyName')
        .populate('userId', 'name'),
    ]);

    res.json({
      success: true,
      data: { totalDealers, totalProperties, activeListings, pendingListings, totalInquiries, pendingDealers, recentListings },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DEALER MANAGEMENT ───────────────────────────────────────────────────────
exports.getDealers = async (req, res) => {
  try {
    const { status, city, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = new RegExp(city, 'i');

    const skip = (Number(page) - 1) * Number(limit);

    if (search && String(search).trim()) {
      const q = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const userIds = await User.find({
        $or: [{ name: q }, { email: q }, { phone: q }],
      }).distinct('_id');
      const orClause = [{ agencyName: q }, { city: q }, { cnic: q }];
      if (userIds.length) orClause.push({ userId: { $in: userIds } });
      filter.$or = orClause;
    }

    const [dealers, total] = await Promise.all([
      Dealer.find(filter)
        .populate('userId', 'name email phone createdAt')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Dealer.countDocuments(filter),
    ]);

    res.json({ success: true, data: dealers, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDealerById = async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id).populate('userId', 'name email phone avatar createdAt');
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });
    const listings = await Property.find({ dealerId: dealer._id }).sort('-createdAt').limit(10);
    const leads = await Inquiry.find({ dealerId: dealer._id }).sort('-createdAt').limit(10);
    res.json({ success: true, data: { dealer, listings, leads } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDealerStatus = async (req, res) => {
  try {
    const { status, package: pkg, packageExpiry } = req.body;
    const update = {};
    if (status) { update.status = status; update.isVerified = status === 'ACTIVE'; }
    if (pkg) update.package = pkg;
    if (packageExpiry) update.packageExpiry = packageExpiry;

    const dealer = await Dealer.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('userId', 'name email phone');

    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });

    const uid = dealer.userId?._id || dealer.userId;

    if (status === 'ACTIVE') {
      await User.findByIdAndUpdate(uid, { isBanned: false });
    } else if (status === 'SUSPENDED' || status === 'REJECTED') {
      await User.findByIdAndUpdate(uid, { isBanned: status === 'SUSPENDED' });
    }

    res.json({ success: true, data: dealer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findByIdAndDelete(req.params.id);
    if (!dealer) return res.status(404).json({ success: false, message: 'Not found' });
    await User.findByIdAndUpdate(dealer.userId, { role: 'USER' });
    res.json({ success: true, message: 'Dealer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LISTING MANAGEMENT ──────────────────────────────────────────────────────
exports.getListings = async (req, res) => {
  try {
    const { status, city, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = new RegExp(city, 'i');
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('dealerId', 'agencyName isVerified')
        .populate('userId', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    res.json({ success: true, data: properties, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /admin/listings/:slug — update status/featured flags
exports.updateListingStatus = async (req, res) => {
  try {
    const { status, isFeatured, isSponsored, rejectionReason } = req.body;
    const update = {};
    if (status) update.status = status;
    if (typeof isFeatured === 'boolean') update.isFeatured = isFeatured;
    if (typeof isSponsored === 'boolean') update.isSponsored = isSponsored;
    if (rejectionReason !== undefined) update.rejectionReason = rejectionReason;

    const property = await Property.findOneAndUpdate({ slug: req.params.slug }, update, { new: true });
    if (!property) return res.status(404).json({ success: false, message: 'Not found' });

    res.json({ success: true, data: property });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /admin/listings/:slug — full edit by admin
exports.updateListingFull = async (req, res) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug });
    if (!property) return res.status(404).json({ success: false, message: 'Not found' });

    // Delete removed images from Cloudinary
    if (req.body.images && Array.isArray(req.body.images)) {
      const oldImgs = normalizeImageRefs(property.images || []);
      const newImgs = normalizeImageRefs(req.body.images || []);
      const oldKeys = new Set(oldImgs.map((i) => i.publicId || i.url).filter(Boolean));
      const newKeys = new Set(newImgs.map((i) => i.publicId || i.url).filter(Boolean));
      const removed = oldImgs.filter((img) => {
        const k = img.publicId || img.url;
        return k && oldKeys.has(k) && !newKeys.has(k);
      });
      if (removed.length > 0) deleteImagesByRefs(removed).catch(() => {});

      req.body.images = newImgs.filter((x) => x.url);
    }

    const updated = await Property.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /admin/listings/:slug
exports.deleteListingAdmin = async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({ slug: req.params.slug });
    if (!property) return res.status(404).json({ success: false, message: 'Not found' });
    if (property.images?.length > 0) deleteImagesByRefs(property.images).catch(() => {});
    res.json({ success: true, message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const [userGrowth, dealerGrowth, listingsByCity, listingsByType] = await Promise.all([
      User.aggregate([
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }, { $limit: 12 },
      ]),
      Dealer.aggregate([
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }, { $limit: 12 },
      ]),
      Property.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]),
      Property.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({ success: true, data: { userGrowth, dealerGrowth, listingsByCity, listingsByType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
