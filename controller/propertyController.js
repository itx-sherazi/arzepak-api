const Property = require('../models/property');
const Dealer   = require('../models/dealer');
const { deleteImagesByRefs, normalizeImageRefs } = require('./uploadController');

const makeSlug = (title) => {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const normalizeEnumToken = (value) => {
  if (typeof value !== 'string') return value;
  // Accept user-friendly values like "Semi Furnished", "SEMI-FURNISHED", etc.
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
};

const imageKey = (img) => img?.publicId || img?.url;

// GET /api/properties  — public search with filters
exports.getProperties = async (req, res) => {
  try {
    const {
      purpose, type, city, areaName, minPrice, maxPrice,
      minArea, maxArea, bedrooms, bathrooms, isFeatured,
      furnishing, addedWithin,
      sort = '-createdAt', page = 1, limit = 12,
    } = req.query;

    const filter = { status: 'ACTIVE' };
    if (purpose)    filter.purpose  = purpose;
    if (type)       filter.type     = type;
    if (city)       filter.city     = new RegExp(city, 'i');
    if (areaName)   filter.areaName = new RegExp(areaName, 'i');
    if (isFeatured) filter.isFeatured = true;
    if (furnishing) filter.furnishing = furnishing;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = Number(minArea);
      if (maxArea) filter.area.$lte = Number(maxArea);
    }
    if (bedrooms)  filter.bedrooms  = Number(bedrooms);
    if (bathrooms) filter.bathrooms = Number(bathrooms);
    if (addedWithin) {
      const days = addedWithin === '1' ? 1 : addedWithin === '7' ? 7 : 30;
      filter.createdAt = { $gte: new Date(Date.now() - days * 864e5) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('dealerId', 'agencyName whatsapp isVerified city logo')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    res.json({ success: true, data: properties, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/properties/:slug
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug })
      .populate('dealerId', 'agencyName whatsapp city bio logo isVerified areasServed experience')
      .populate('userId', 'name phone avatar');

    if (!property || property.status === 'REJECTED')
      return res.status(404).json({ success: false, message: 'Property not found' });

    res.json({ success: true, data: property });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/properties  — dealer or user
exports.createProperty = async (req, res) => {
  try {
    const body = { ...req.body, userId: req.user._id };

    body.slug = makeSlug(req.body.title || 'property');
    body.furnishing = normalizeEnumToken(body.furnishing);

    if (body.images && Array.isArray(body.images)) {
      body.images = normalizeImageRefs(body.images).filter((x) => x.url);
    }

    if (req.user.role === 'DEALER') {
      const dealer = await Dealer.findOne({ userId: req.user._id });
      if (!dealer || dealer.status !== 'ACTIVE')
        return res.status(403).json({ success: false, message: 'Dealer account not active' });
      body.dealerId = dealer._id;
      body.status   = 'ACTIVE'; // Dealers publish directly
    }

    const property = await Property.create(body);

    if (body.dealerId) {
      await Dealer.findByIdAndUpdate(body.dealerId, { $inc: { totalListings: 1 } });
    }

    res.status(201).json({ success: true, data: property });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/properties/:slug
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug });
    if (!property) return res.status(404).json({ success: false, message: 'Not found' });

    let dealerIdForUser = null;
    if (req.user.role === 'DEALER') {
      dealerIdForUser = (await Dealer.findOne({ userId: req.user._id }).select('_id'))?._id;
    }

    const isOwner =
      property.userId?.toString() === req.user._id.toString() ||
      (req.user.role === 'DEALER' && dealerIdForUser && property.dealerId?.toString() === dealerIdForUser.toString());

    if (!isOwner && req.user.role !== 'ADMIN')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    // Images: accept either legacy string[] or new [{url, publicId}] shape.
    // If caller replaces a single image, the old one becomes "removed" and is deleted from Cloudinary.
    if (req.body.images && Array.isArray(req.body.images)) {
      const oldImgs = normalizeImageRefs(property.images || []);
      const newImgs = normalizeImageRefs(req.body.images || []);
      const oldKeys = new Set(oldImgs.map(imageKey).filter(Boolean));
      const newKeys = new Set(newImgs.map(imageKey).filter(Boolean));
      const removed = oldImgs.filter((img) => {
        const k = imageKey(img);
        return k && oldKeys.has(k) && !newKeys.has(k);
      });
      if (removed.length > 0) deleteImagesByRefs(removed).catch(() => {}); // fire-and-forget

      // Persist normalized shape
      req.body.images = newImgs.filter((x) => x.url);
    }

    if (req.body.furnishing !== undefined) {
      req.body.furnishing = normalizeEnumToken(req.body.furnishing);
    }

    // Non-admin: reset status to ACTIVE (dealer owns it) or PENDING (user needs approval)
    if (req.user.role !== 'ADMIN') {
      req.body.status = req.user.role === 'DEALER' ? 'ACTIVE' : 'PENDING';
    }

    const updated = await Property.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/properties/:slug
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug });
    if (!property) return res.status(404).json({ success: false, message: 'Not found' });

    let dealerIdForUser = null;
    if (req.user.role === 'DEALER') {
      dealerIdForUser = (await Dealer.findOne({ userId: req.user._id }).select('_id'))?._id;
    }

    const isOwner =
      property.userId?.toString() === req.user._id.toString() ||
      (req.user.role === 'DEALER' && dealerIdForUser && property.dealerId?.toString() === dealerIdForUser.toString()) ||
      req.user.role === 'ADMIN';

    if (!isOwner) return res.status(403).json({ success: false, message: 'Forbidden' });

    await property.deleteOne();

    // Delete all images from Cloudinary
    if (property.images?.length > 0) deleteImagesByRefs(property.images).catch(() => {});

    if (property.dealerId) {
      await Dealer.findByIdAndUpdate(property.dealerId, { $inc: { totalListings: -1 } });
    }

    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/properties/my — logged-in user's own listings
exports.myProperties = async (req, res) => {
  try {
    const filter = req.user.role === 'DEALER'
      ? { dealerId: (await Dealer.findOne({ userId: req.user._id }))?._id }
      : { userId: req.user._id };

    const { status, page = 1, limit = 10 } = req.query;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    res.json({ success: true, data: properties, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/properties/:slug/status  — dealer mark sold/rented
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['SOLD', 'RENTED', 'ACTIVE'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const filter = { slug: req.params.slug };
    if (req.user.role === 'DEALER') {
      const dealer = await Dealer.findOne({ userId: req.user._id }).select('_id');
      if (!dealer) return res.status(403).json({ success: false, message: 'Dealer not found' });
      filter.dealerId = dealer._id;
    }

    const property = await Property.findOneAndUpdate(filter, { status }, { new: true });
    if (!property) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: property });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
