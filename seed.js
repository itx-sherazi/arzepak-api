/**
 * arzepak Seed Script
 * Run: node seed.js
 * Creates: 1 admin, 2 dealers (with properties, leads), 3 regular users, 3 projects
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User     = require('./models/user');
const Dealer   = require('./models/dealer');
const Property = require('./models/property');
const Project  = require('./models/project');
const Inquiry  = require('./models/inquiry');

const IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
];

const makeSlug = (title) => {
  const base = String(title || 'property')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Ensure indexes reflect current schema (also removes duplicate index warnings).
  // Safe for dev/test seeding; avoids stale unique slug indexes causing dup errors.
  await Promise.all([Property.syncIndexes(), Project.syncIndexes()]);

  // ── Clean ──────────────────────────────────────────────────────────────────
  const emails = [
    'admin@arzepak.com', 'dealer1@arzepak.com', 'dealer2@arzepak.com',
    'user1@arzepak.com', 'user2@arzepak.com', 'user3@arzepak.com',
  ];

  const existingUsers = await User.find({ email: { $in: emails } });
  if (existingUsers.length) {
    const userIds = existingUsers.map(u => u._id);
    const dealers = await Dealer.find({ userId: { $in: userIds } });
    const dealerIds = dealers.map(d => d._id);

    await Promise.all([
      Property.deleteMany({ dealerId: { $in: dealerIds } }),
      Inquiry.deleteMany({ dealerId: { $in: dealerIds } }),
      Dealer.deleteMany({ userId: { $in: userIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);
  }

  // Clean seed projects
  await Project.deleteMany({ slug: { $in: ['park-avenue-residences-1001', 'bahria-sky-towers-1002', 'capital-smart-villas-1003'] } });


  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@arzepak.com',
    phone: '03001234567',
    password: 'admin123',
    role: 'ADMIN',
    isVerified: true,
  });
  console.log('👤 Admin created  →  admin@arzepak.com / admin123');

  // ── Regular Users ──────────────────────────────────────────────────────────
  const [u1, u2, u3] = await User.insertMany([
    { name: 'Ahmed Raza',   email: 'user1@arzepak.com', phone: '03111111111', password: 'user123', role: 'USER' },
    { name: 'Sara Khan',    email: 'user2@arzepak.com', phone: '03222222222', password: 'user123', role: 'USER' },
    { name: 'Bilal Sheikh', email: 'user3@arzepak.com', phone: '03333333333', password: 'user123', role: 'USER' },
  ]);
  console.log('👥 3 users created  →  user1/2/3@arzepak.com / user123');

  // ── Dealer 1: City Properties (Lahore) ────────────────────────────────────
  const dUser1 = await User.create({
    name: 'Ali Hassan',
    email: 'dealer1@arzepak.com',
    phone: '03001000001',
    password: 'dealer123',
    role: 'DEALER',
    isVerified: true,
  });

  const dealer1 = await Dealer.create({
    userId:      dUser1._id,
    agencyName:  'City Properties',
    whatsapp:    '923001000001',
    city:        'Lahore',
    areasServed: ['DHA', 'Bahria Town', 'Gulberg', 'Model Town'],
    experience:  8,
    bio:         'Premium real estate agency in Lahore with 8+ years of experience. Specializing in DHA and Bahria Town properties.',
    status:      'ACTIVE',
    package:     'PREMIUM',
    packageExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isVerified:  true,
    cnic:        '35202-1234567-1',
    logo:        'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
    totalListings: 0,
    totalLeads:    0,
  });

  // ── Dealer 2: Karachi Homes (Karachi) ─────────────────────────────────────
  const dUser2 = await User.create({
    name: 'Zara Ahmed',
    email: 'dealer2@arzepak.com',
    phone: '03002000002',
    password: 'dealer123',
    role: 'DEALER',
    isVerified: true,
  });

  const dealer2 = await Dealer.create({
    userId:      dUser2._id,
    agencyName:  'Karachi Homes',
    whatsapp:    '923002000002',
    city:        'Karachi',
    areasServed: ['DHA Karachi', 'Clifton', 'Gulshan-e-Iqbal'],
    experience:  5,
    bio:         'Leading real estate agency in Karachi. Expert in DHA and Clifton area properties.',
    status:      'ACTIVE',
    package:     'STANDARD',
    packageExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    isVerified:  true,
    cnic:        '42301-9876543-2',
    logo:        'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200',
    totalListings: 0,
    totalLeads:    0,
  });

  // ── Properties for Dealer 1 ────────────────────────────────────────────────
  const props1 = await Property.insertMany([
    {
      title: '5 Marla House for Sale in DHA Phase 5',
      slug: makeSlug('5 Marla House for Sale in DHA Phase 5'),
      description: 'Beautiful 5 Marla house in DHA Phase 5 Lahore. Double story, fully renovated with modern fittings. Has a spacious drawing room, 3 bedrooms with attached baths, and a well-maintained lawn.',
      purpose: 'SALE', type: 'HOUSE', price: 28500000,
      area: 5, areaUnit: 'MARLA', bedrooms: 3, bathrooms: 3, floors: 2,
      furnishing: 'SEMI_FURNISHED', buildYear: 2018,
      city: 'Lahore', areaName: 'DHA Phase 5',
      address: 'Street 12, Block D, DHA Phase 5, Lahore',
      images: [IMAGES[0], IMAGES[1], IMAGES[2]],
      amenities: ['Parking', 'Generator', 'CCTV', 'Lawn', 'Solar Panels'],
      status: 'ACTIVE', isFeatured: true,
      userId: dUser1._id, dealerId: dealer1._id,
    },
    {
      title: '10 Marla House for Rent in Bahria Town',
      slug: makeSlug('10 Marla House for Rent in Bahria Town'),
      description: 'Luxury 10 Marla house available for rent in Bahria Town Lahore. Brand new construction, corner plot, with 4 bedrooms, modern kitchen and covered parking for 2 cars.',
      purpose: 'RENT', type: 'HOUSE', price: 85000,
      area: 10, areaUnit: 'MARLA', bedrooms: 4, bathrooms: 4, floors: 2,
      furnishing: 'FURNISHED', buildYear: 2022,
      city: 'Lahore', areaName: 'Bahria Town',
      address: 'Sector C, Bahria Town, Lahore',
      images: [IMAGES[1], IMAGES[3], IMAGES[4]],
      amenities: ['Parking', 'Generator', 'Gas', 'Internet', 'Security'],
      status: 'ACTIVE', isFeatured: false,
      userId: dUser1._id, dealerId: dealer1._id,
    },
    {
      title: '1 Kanal Plot for Sale in DHA Phase 6',
      slug: makeSlug('1 Kanal Plot for Sale in DHA Phase 6'),
      description: 'Prime location 1 Kanal residential plot for sale in DHA Phase 6. Facing park, possession available, ideal for construction.',
      purpose: 'SALE', type: 'PLOT', price: 65000000,
      area: 1, areaUnit: 'KANAL',
      city: 'Lahore', areaName: 'DHA Phase 6',
      address: 'Block A, DHA Phase 6, Lahore',
      images: [IMAGES[4], IMAGES[5]],
      amenities: ['Electricity', 'Gas', 'Water'],
      status: 'ACTIVE', isFeatured: true,
      userId: dUser1._id, dealerId: dealer1._id,
    },
    {
      title: '2 Bedroom Apartment in Gulberg',
      slug: makeSlug('2 Bedroom Apartment in Gulberg'),
      description: 'Modern 2 bedroom apartment on 8th floor with city view. Fully furnished, ideal for families and professionals. 24/7 security and elevator.',
      purpose: 'RENT', type: 'APARTMENT', price: 45000,
      area: 950, areaUnit: 'SQFT', bedrooms: 2, bathrooms: 2,
      furnishing: 'FURNISHED', buildYear: 2020,
      city: 'Lahore', areaName: 'Gulberg III',
      address: 'Main Boulevard, Gulberg III, Lahore',
      images: [IMAGES[2], IMAGES[0], IMAGES[3]],
      amenities: ['Elevator', 'Parking', 'Generator', 'CCTV', 'Internet'],
      status: 'ACTIVE',
      userId: dUser1._id, dealerId: dealer1._id,
    },
    {
      title: 'Commercial Shop for Sale in Model Town',
      slug: makeSlug('Commercial Shop for Sale in Model Town'),
      description: 'Prime commercial shop on main commercial boulevard in Model Town. Ground floor, high foot traffic area, suitable for any business.',
      purpose: 'SALE', type: 'COMMERCIAL', price: 18000000,
      area: 400, areaUnit: 'SQFT',
      city: 'Lahore', areaName: 'Model Town',
      address: 'Commercial Boulevard, Model Town, Lahore',
      images: [IMAGES[5], IMAGES[1]],
      amenities: ['Electricity', 'Water', 'Parking'],
      status: 'ACTIVE',
      userId: dUser1._id, dealerId: dealer1._id,
    },
  ]);

  // ── Properties for Dealer 2 ────────────────────────────────────────────────
  const props2 = await Property.insertMany([
    {
      title: '3 Bedroom Apartment in DHA Karachi',
      slug: makeSlug('3 Bedroom Apartment in DHA Karachi'),
      description: 'Luxurious 3 bedroom apartment in DHA Phase 6 Karachi. Sea-facing unit on 12th floor with stunning views. Fully furnished with premium fittings.',
      purpose: 'SALE', type: 'APARTMENT', price: 42000000,
      area: 1800, areaUnit: 'SQFT', bedrooms: 3, bathrooms: 3,
      furnishing: 'FURNISHED', buildYear: 2021,
      city: 'Karachi', areaName: 'DHA Phase 6',
      address: 'Saba Avenue, DHA Phase 6, Karachi',
      images: [IMAGES[3], IMAGES[0], IMAGES[5]],
      amenities: ['Elevator', 'Parking', 'Generator', 'CCTV', 'Gym', 'Swimming Pool'],
      status: 'ACTIVE', isFeatured: true,
      userId: dUser2._id, dealerId: dealer2._id,
    },
    {
      title: '500 Sqyd Plot in Clifton Block 9',
      slug: makeSlug('500 Sqyd Plot in Clifton Block 9'),
      description: 'Residential plot in the heart of Clifton. Ideal location for building your dream home. Utilities available, transfer in process.',
      purpose: 'SALE', type: 'PLOT', price: 75000000,
      area: 500, areaUnit: 'SQYD',
      city: 'Karachi', areaName: 'Clifton',
      address: 'Block 9, Clifton, Karachi',
      images: [IMAGES[1], IMAGES[4]],
      amenities: ['Electricity', 'Gas', 'Water'],
      status: 'ACTIVE',
      userId: dUser2._id, dealerId: dealer2._id,
    },
    {
      title: 'House for Rent in Gulshan-e-Iqbal',
      slug: makeSlug('House for Rent in Gulshan-e-Iqbal'),
      description: 'Well-maintained 4 bedroom house in Block 13-D Gulshan-e-Iqbal. Separate portion on ground floor. Available for family only.',
      purpose: 'RENT', type: 'HOUSE', price: 55000,
      area: 8, areaUnit: 'MARLA', bedrooms: 4, bathrooms: 3, floors: 1,
      furnishing: 'UNFURNISHED', buildYear: 2015,
      city: 'Karachi', areaName: 'Gulshan-e-Iqbal',
      address: 'Block 13-D, Gulshan-e-Iqbal, Karachi',
      images: [IMAGES[2], IMAGES[5], IMAGES[0]],
      amenities: ['Parking', 'Gas', 'Water', 'Security'],
      status: 'ACTIVE',
      userId: dUser2._id, dealerId: dealer2._id,
    },
  ]);

  // ── Update dealer stats ────────────────────────────────────────────────────
  await Dealer.findByIdAndUpdate(dealer1._id, { totalListings: props1.length });
  await Dealer.findByIdAndUpdate(dealer2._id, { totalListings: props2.length });

  console.log(`🏠 ${props1.length + props2.length} properties created`);

  // ── Leads / Inquiries ──────────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 864e5);

  const inquiries = await Inquiry.insertMany([
    // Dealer 1 leads
    { name: u1.name, email: u1.email, phone: u1.phone, message: 'I am interested in this property. Can we schedule a visit this weekend?', propertyId: props1[0]._id, dealerId: dealer1._id, userId: u1._id, status: 'NEW', createdAt: daysAgo(1) },
    { name: u2.name, email: u2.email, phone: u2.phone, message: 'Is the price negotiable? We are a family of 4 looking for immediate move-in.', propertyId: props1[1]._id, dealerId: dealer1._id, userId: u2._id, status: 'CONTACTED', createdAt: daysAgo(5) },
    { name: u3.name, email: u3.email, phone: u3.phone, message: 'Please share more details about the plot dimensions and possession date.', propertyId: props1[2]._id, dealerId: dealer1._id, userId: u3._id, status: 'CONVERTED', createdAt: daysAgo(15) },
    { name: 'Usman Mirza', email: 'usman@test.com', phone: '03441234567', message: 'Can this apartment be rented on a 6-month lease?', propertyId: props1[3]._id, dealerId: dealer1._id, status: 'NEW', createdAt: daysAgo(2) },
    { name: 'Nadia Farooq', email: 'nadia@test.com', phone: '03551234567', message: 'What is the monthly rent and security deposit required?', propertyId: props1[1]._id, dealerId: dealer1._id, status: 'CLOSED', createdAt: daysAgo(30) },
    // Dealer 2 leads
    { name: u1.name, email: u1.email, phone: u1.phone, message: 'Is this apartment sea-facing from all rooms? When can I visit?', propertyId: props2[0]._id, dealerId: dealer2._id, userId: u1._id, status: 'NEW', createdAt: daysAgo(3) },
    { name: u3.name, email: u3.email, phone: u3.phone, message: 'I want to buy this plot. Can we meet tomorrow?', propertyId: props2[1]._id, dealerId: dealer2._id, userId: u3._id, status: 'CONTACTED', createdAt: daysAgo(7) },
  ]);

  // Update dealer totalLeads
  await Dealer.findByIdAndUpdate(dealer1._id, { totalLeads: 5 });
  await Dealer.findByIdAndUpdate(dealer2._id, { totalLeads: 2 });

  console.log(`📩 ${inquiries.length} leads created`);

  // ── Projects ───────────────────────────────────────────────────────────────
  await Project.insertMany([
    {
      title:       'Park Avenue Residences',
      slug:        'park-avenue-residences-1001',
      city:        'Lahore',
      address:     'Main Ferozepur Road, Near Expo Centre, Lahore',
      developer:   'Arif Habib Corporation',
      marketedBy:  'City Properties',
      description: 'Park Avenue Residences is a landmark residential project offering premium apartments and penthouses in the heart of Lahore. Situated on Main Ferozepur Road, the project features state-of-the-art amenities including a rooftop infinity pool, modern gymnasium, and dedicated children\'s play area. Each unit is thoughtfully designed with floor-to-ceiling windows offering panoramic city views, Italian marble flooring, and fully imported kitchen fittings. The project is surrounded by lush green parks, top schools, and major shopping centres making it an ideal choice for families seeking luxury urban living.',
      status:      'BOOKING_OPEN',
      isFeatured:  true,
      offering:    ['Apartments', 'Penthouses', 'Retail Shops'],
      totalUnits:  240,
      completionDate: 'December 2026',
      minPrice:    18500000,
      maxPrice:    65000000,
      amenities:   ['Rooftop Infinity Pool', 'Gymnasium', 'Children\'s Play Area', 'Underground Parking', '24/7 Security', 'CCTV Surveillance', 'Backup Generator', 'High-Speed Elevators', 'Concierge Service', 'Grand Lobby'],
      features: {
        mainFeatures:     ['Corner Project', 'Gated Community', 'Earthquake Resistant Structure', 'Smart Home Technology', 'Solar Energy System'],
        plotFeatures:     ['Park Facing Units', 'Corner Units Available', 'Dual Aspect Layouts'],
        businessComm:     ['Ground Floor Retail', 'Café & Restaurant Space', 'Co-Working Lounge'],
        nearbyFacilities: ['Expo Centre Lahore', 'Packages Mall', 'Jinnah Hospital', 'Lahore Grammar School', 'McDonald\'s & KFC Nearby'],
        otherFacilities:  ['Visitor Parking', 'Laundry Service', 'Maintenance Team', 'Community Hall', 'Prayer Area'],
      },
      units: [
        { name: '1 Bedroom Apartment', minPrice: 18500000, maxPrice: 24000000, minArea: 750,  maxArea: 900,  areaUnit: 'SQFT', bedrooms: 1, bathrooms: 1 },
        { name: '2 Bedroom Apartment', minPrice: 28000000, maxPrice: 38000000, minArea: 1200, maxArea: 1500, areaUnit: 'SQFT', bedrooms: 2, bathrooms: 2 },
        { name: '3 Bedroom Apartment', minPrice: 42000000, maxPrice: 55000000, minArea: 1800, maxArea: 2200, areaUnit: 'SQFT', bedrooms: 3, bathrooms: 3 },
        { name: 'Penthouse',           minPrice: 58000000, maxPrice: 65000000, minArea: 3000, maxArea: 3500, areaUnit: 'SQFT', bedrooms: 4, bathrooms: 4 },
      ],
      images: [
        'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      ],
      floorPlans: [
        { label: '1 Bed Layout',   image: 'https://images.unsplash.com/photo-1574691250077-03a929faece5?w=600' },
        { label: '2 Bed Layout',   image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600' },
        { label: '3 Bed Layout',   image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600' },
      ],
      updates: [
        { title: 'Foundation Work Completed', content: 'We are pleased to announce that the foundation and piling work for all 3 towers has been successfully completed ahead of schedule.', date: new Date('2025-08-15') },
        { title: 'Bookings Now Open', content: 'Limited units are now available for booking. 20% down payment and flexible 3-year installment plan available.', date: new Date('2025-06-01') },
      ],
      latitude:  31.5204,
      longitude: 74.3587,
      addedBy:   admin._id,
    },

    {
      title:       'Bahria Sky Towers',
      slug:        'bahria-sky-towers-1002',
      city:        'Karachi',
      address:     'Bahria Town Karachi, Precinct 19, Super Highway',
      developer:   'Bahria Town Pvt Ltd',
      marketedBy:  'Karachi Homes',
      description: 'Bahria Sky Towers is an iconic twin-tower development rising 42 floors above Bahria Town Karachi. Designed by renowned architects, this project redefines luxury living with breathtaking ocean views, world-class facilities, and meticulously crafted interiors. The project offers a range of unit types from studio apartments to expansive 4-bedroom residences, catering to both investors and end-users. Located within the secure gated community of Bahria Town Karachi, residents enjoy access to international schools, hospitals, golf course, and a dedicated theme park. An attractive 4-year installment plan makes this an unbeatable investment opportunity.',
      status:      'UNDER_CONSTRUCTION',
      isFeatured:  true,
      offering:    ['Studio Apartments', 'Apartments', 'Duplexes'],
      totalUnits:  560,
      completionDate: 'March 2027',
      minPrice:    8500000,
      maxPrice:    95000000,
      amenities:   ['Olympic-Size Swimming Pool', 'Fully Equipped Gym', 'Spa & Wellness Centre', 'Business Centre', 'Rooftop Restaurant', 'Smart Home Automation', 'High-Speed Internet', '24/7 CCTV & Security', 'Covered Parking', 'Mosque'],
      features: {
        mainFeatures:     ['42-Storey Twin Towers', 'LEED Certified Green Building', 'Helipad on Roof', 'Ocean View Units', 'Smart Building Management System'],
        plotFeatures:     ['Sea Facing', 'Corner Towers', 'Podium Level Amenities'],
        businessComm:     ['Retail Mall in Podium', 'Food Court', 'Supermarket', 'Medical Centre'],
        nearbyFacilities: ['Bahria International Hospital', 'Bahria University', 'Bahria Golf & Country Club', 'Grand Jamia Masjid', 'Bahria Theme Park'],
        otherFacilities:  ['Valet Parking', 'Butler Service', 'Dog Walking Area', 'EV Charging Stations', 'Water Filtration Plant'],
      },
      units: [
        { name: 'Studio Apartment',    minPrice: 8500000,  maxPrice: 12000000, minArea: 450,  maxArea: 550,  areaUnit: 'SQFT', bedrooms: 0, bathrooms: 1 },
        { name: '1 Bedroom Apartment', minPrice: 14000000, maxPrice: 22000000, minArea: 800,  maxArea: 1100, areaUnit: 'SQFT', bedrooms: 1, bathrooms: 1 },
        { name: '2 Bedroom Apartment', minPrice: 28000000, maxPrice: 42000000, minArea: 1400, maxArea: 1900, areaUnit: 'SQFT', bedrooms: 2, bathrooms: 2 },
        { name: '3 Bedroom Apartment', minPrice: 48000000, maxPrice: 68000000, minArea: 2200, maxArea: 2800, areaUnit: 'SQFT', bedrooms: 3, bathrooms: 3 },
        { name: '4 Bedroom Duplex',    minPrice: 75000000, maxPrice: 95000000, minArea: 3800, maxArea: 4500, areaUnit: 'SQFT', bedrooms: 4, bathrooms: 4 },
      ],
      images: [
        'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&q=80',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      ],
      floorPlans: [
        { label: 'Studio Layout',  image: 'https://images.unsplash.com/photo-1574691250077-03a929faece5?w=600' },
        { label: '2 Bed Layout',   image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600' },
        { label: 'Duplex Layout',  image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600' },
      ],
      updates: [
        { title: 'Tower A — Floor 15 Reached', content: 'Construction on Tower A has reached the 15th floor milestone. Tower B piling work is complete and slab work is underway.', date: new Date('2025-10-01') },
        { title: 'Interior Finishing Samples Selected', content: 'Marble and tile samples for common areas and unit interiors have been finalized. Import orders placed from Italy and Spain.', date: new Date('2025-07-20') },
        { title: 'Project Launch Ceremony', content: 'Bahria Sky Towers was officially launched at a grand ceremony attended by 500+ investors. All studio units sold out within 48 hours.', date: new Date('2025-04-10') },
      ],
      latitude:  25.0760,
      longitude: 67.1900,
      addedBy:   admin._id,
    },

    {
      title:       'Capital Smart Villas',
      slug:        'capital-smart-villas-1003',
      city:        'Islamabad',
      address:     'Capital Smart City, M-2 Motorway Interchange, Islamabad',
      developer:   'Future Developments Pvt Ltd',
      marketedBy:  'PropFind Official',
      description: 'Capital Smart Villas is Pakistan\'s first truly smart villa community, nestled within the award-winning Capital Smart City on the outskirts of Islamabad. Each villa is equipped with AI-powered home automation, solar energy systems, and a private pool — all set against the picturesque backdrop of the Margalla Hills. The project offers 5 Marla, 7 Marla, and 10 Marla villas with customisable floor plans. Residents benefit from Capital Smart City\'s world-class infrastructure including an international airport proximity, dedicated ballpark, healthcare city, and the famous Harmain Iconic Mosque. With Islamabad\'s rapid expansion, this project offers exceptional capital appreciation potential.',
      status:      'LAUNCHING_SOON',
      isFeatured:  false,
      offering:    ['5 Marla Villas', '7 Marla Villas', '10 Marla Villas'],
      totalUnits:  350,
      completionDate: 'June 2028',
      minPrice:    22000000,
      maxPrice:    68000000,
      amenities:   ['Private Swimming Pool per Villa', 'Smart Home System (Alexa/Google)', 'Solar Power System', 'Landscaped Garden', 'Double Garage', 'Central Park Access', 'Community Club House', 'Jogging & Cycling Tracks', 'Gated Entry with Biometric', 'Kids\' Play Zones'],
      features: {
        mainFeatures:     ['Pakistan\'s First AI-Enabled Villa Community', 'Zero Energy Homes (Solar)', 'Private Pool with Every Villa', 'Customisable Floor Plans', 'Eco-Friendly Construction Materials'],
        plotFeatures:     ['5 / 7 / 10 Marla Options', 'Park Facing Available', 'Corner Plots Available', 'Possession in 36 Months'],
        businessComm:     ['Community Commercial Area', 'Petrol Station', 'Pharmacy & Clinic', 'Grocery Superstore'],
        nearbyFacilities: ['New Islamabad International Airport (12 min)', 'Capital University (5 min)', 'Capital Smart City Golf Club', 'Harmain Iconic Mosque', 'Motorway M-2 Direct Access'],
        otherFacilities:  ['24/7 Maintenance Team', 'Garbage Collection Service', 'Street Lighting (Solar)', 'Fire Safety System', 'Underground Utility Lines'],
      },
      units: [
        { name: '5 Marla Villa',  minPrice: 22000000, maxPrice: 32000000, minArea: 5,  maxArea: 5,  areaUnit: 'MARLA', bedrooms: 3, bathrooms: 3 },
        { name: '7 Marla Villa',  minPrice: 34000000, maxPrice: 46000000, minArea: 7,  maxArea: 7,  areaUnit: 'MARLA', bedrooms: 4, bathrooms: 4 },
        { name: '10 Marla Villa', minPrice: 52000000, maxPrice: 68000000, minArea: 10, maxArea: 10, areaUnit: 'MARLA', bedrooms: 5, bathrooms: 5 },
      ],
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
      ],
      floorPlans: [
        { label: '5 Marla Ground Floor',  image: 'https://images.unsplash.com/photo-1574691250077-03a929faece5?w=600' },
        { label: '5 Marla First Floor',   image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600' },
        { label: '10 Marla Ground Floor', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600' },
      ],
      updates: [
        { title: 'Pre-Launch Registration Open', content: 'Register your interest now to get priority access and early-bird pricing before the official launch event in Q1 2026. Limited balloting slots available.', date: new Date('2025-11-01') },
        { title: 'Show Villa Ready for Viewing', content: 'Visit our fully furnished 5 Marla show villa at Capital Smart City to experience the future of smart living. Open for visits every Saturday from 10 AM to 5 PM.', date: new Date('2025-09-15') },
      ],
      latitude:  33.5651,
      longitude: 72.8169,
      addedBy:   admin._id,
    },
  ]);

  console.log('🏗️  3 projects seeded (Park Avenue Residences, Bahria Sky Towers, Capital Smart Villas)');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 Seed complete! Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 ADMIN   →  admin@arzepak.com    /  admin123');
  console.log('🏢 DEALER1 →  dealer1@arzepak.com  /  dealer123  (City Properties, Lahore, PREMIUM)');
  console.log('🏢 DEALER2 →  dealer2@arzepak.com  /  dealer123  (Karachi Homes, Karachi, STANDARD)');
  console.log('👤 USER1   →  user1@arzepak.com    /  user123');
  console.log('👤 USER2   →  user2@arzepak.com    /  user123');
  console.log('👤 USER3   →  user3@arzepak.com    /  user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
