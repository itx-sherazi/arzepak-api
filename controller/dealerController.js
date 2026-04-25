const Dealer = require('../models/dealer');
const User = require('../models/user');
const Property = require('../models/property');
const Inquiry = require('../models/inquiry');
const { deleteImagesByRefs } = require('./uploadController');

function normalizeCnicDigits(str) {
  return String(str || '').replace(/\D/g, '').slice(0, 13);
}

function formatCnic(str) {
  const d = normalizeCnicDigits(str);
  if (d.length !== 13) return d;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12, 13)}`;
}

// POST /api/dealers/register — register as dealer (CNIC, areas, etc. can be completed later in dashboard)
exports.registerDealer = async (req, res) => {
  try {
    const existing = await Dealer.findOne({ userId: req.user._id });
    if (existing) return res.status(409).json({ success: false, message: 'Already registered as dealer' });

    const {
      agencyName,
      companyEmail,
      address,
      cnic,
      bio,
      whatsapp,
      city,
      areasServed,
      experience,
      logo,
    } = req.body;

    if (!agencyName || !String(agencyName).trim()) {
      return res.status(400).json({ success: false, message: 'Agency name is required' });
    }
    if (!city || !String(city).trim()) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }
    if (!companyEmail || !String(companyEmail).trim()) {
      return res.status(400).json({ success: false, message: 'Company email is required' });
    }
    if (!address || !String(address).trim()) {
      return res.status(400).json({ success: false, message: 'Agency address is required' });
    }

    const cnicDigits = normalizeCnicDigits(cnic);
    let cnicValue = '';
    if (cnicDigits.length === 0) {
      cnicValue = '';
    } else if (cnicDigits.length === 13) {
      cnicValue = formatCnic(cnicDigits);
    } else {
      return res.status(400).json({ success: false, message: 'CNIC must be 13 digits' });
    }

    const logoUrl = logo != null && String(logo).trim() ? String(logo).trim() : undefined;

    const dealer = await Dealer.create({
      userId: req.user._id,
      agencyName: String(agencyName).trim(),
      companyEmail: String(companyEmail).trim().toLowerCase(),
      address: String(address).trim(),
      cnic: cnicValue,
      bio: bio != null ? String(bio) : '',
      whatsapp: whatsapp != null && String(whatsapp).trim() ? String(whatsapp).trim() : '',
      city: String(city).trim(),
      areasServed: Array.isArray(areasServed) ? areasServed : [],
      experience: experience != null && experience !== '' ? Number(experience) : 0,
      ...(logoUrl ? { logo: logoUrl } : {}),
    });

    await User.findByIdAndUpdate(req.user._id, { role: 'DEALER' });

    res.status(201).json({ success: true, data: dealer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/dealers — public list of active dealers
exports.getDealers = async (req, res) => {
  try {
    const { city, page = 1, limit = 12 } = req.query;
    const filter = { status: 'ACTIVE' };
    if (city) filter.city = new RegExp(city, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [dealers, total] = await Promise.all([
      Dealer.find(filter)
        .populate('userId', 'name email phone avatar')
        .sort('-avgRating -totalListings')
        .skip(skip)
        .limit(Number(limit)),
      Dealer.countDocuments(filter),
    ]);

    res.json({ success: true, data: dealers, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dealers/:id — public dealer profile
exports.getDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.params.id)
      .populate('userId', 'name email phone avatar createdAt');
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });

    const properties = await Property.find({ dealerId: dealer._id, status: 'ACTIVE' }).limit(6).sort('-createdAt');

    res.json({ success: true, data: { dealer, properties } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dealers/me — dealer's own profile
exports.getMyProfile = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ userId: req.user._id });
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer profile not found' });
    res.json({ success: true, data: dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/dealers/me/profile — update own dealer profile
exports.updateMyProfile = async (req, res) => {
  try {
    const { agencyName, companyEmail, address, bio, whatsapp, city, areasServed, logo, experience, cnic } = req.body;
    const existing = await Dealer.findOne({ userId: req.user._id });
    if (!existing) return res.status(404).json({ success: false, message: 'Dealer profile not found' });

    const nextLogo = logo !== undefined ? logo : existing.logo;
    const oldLogo = existing.logo ? String(existing.logo).trim() : '';
    const newLogo = nextLogo != null ? String(nextLogo).trim() : '';
    if (oldLogo && newLogo !== oldLogo) {
      try {
        await deleteImagesByRefs([oldLogo]);
      } catch (e) {
        console.error('delete old dealer logo:', e?.message || e);
      }
    }

    const update = {};
    if (agencyName !== undefined) update.agencyName = agencyName;
    if (companyEmail !== undefined) update.companyEmail = companyEmail;
    if (address !== undefined) update.address = address;
    if (bio !== undefined) update.bio = bio;
    if (whatsapp !== undefined) update.whatsapp = whatsapp;
    if (city !== undefined) update.city = city;
    if (areasServed !== undefined) update.areasServed = areasServed;
    if (logo !== undefined) update.logo = logo;
    if (experience !== undefined) update.experience = experience;

    if (cnic !== undefined) {
      const d = normalizeCnicDigits(cnic);
      if (d.length !== 13) {
        return res.status(400).json({ success: false, message: 'CNIC must be 13 digits' });
      }
      update.cnic = formatCnic(d);
    }

    const dealer = await Dealer.findOneAndUpdate({ userId: req.user._id }, update, { new: true });
    res.json({ success: true, data: dealer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/dealers/me/leads — dealer's inquiry leads
exports.getMyLeads = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ userId: req.user._id });
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { dealerId: dealer._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      Inquiry.find(filter)
        .populate('propertyId', 'title city images price')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Inquiry.countDocuments(filter),
    ]);

    res.json({ success: true, data: leads, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/dealers/leads/:id — update lead status
exports.updateLeadStatus = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ userId: req.user._id });
    const inquiry = await Inquiry.findOne({ _id: req.params.id, dealerId: dealer._id });
    if (!inquiry) return res.status(404).json({ success: false, message: 'Lead not found' });

    inquiry.status = req.body.status;
    await inquiry.save();
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/dealers/me/analytics — dealer dashboard stats
exports.getMyAnalytics = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ userId: req.user._id });
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });

    const [
      totalListings,
      activeListings,
      pendingListings,
      totalLeads,
      newLeads,
      topProperties,
      monthlyLeads,
    ] = await Promise.all([
      Property.countDocuments({ dealerId: dealer._id }),
      Property.countDocuments({ dealerId: dealer._id, status: 'ACTIVE' }),
      Property.countDocuments({ dealerId: dealer._id, status: 'PENDING' }),
      Inquiry.countDocuments({ dealerId: dealer._id }),
      Inquiry.countDocuments({ dealerId: dealer._id, status: 'NEW' }),
      Property.find({ dealerId: dealer._id }).sort('-createdAt').limit(5).select('title city price images'),
      Inquiry.aggregate([
        { $match: { dealerId: dealer._id } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalListings, activeListings, pendingListings,
        totalLeads, newLeads,
        package: dealer.package,
        packageExpiry: dealer.packageExpiry,
        topProperties,
        monthlyLeads,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
