/**
 * Dummy property seed script — run once to populate 15 listings for frontend filter testing.
 * Also creates a dummy dealer (user + dealer record) with whatsapp + phone numbers.
 * Usage:  node seedProperties.js
 * Requires MONGO_URI in backend/.env
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/property');
const Dealer   = require('./models/dealer');
const User     = require('./models/user');
const Post     = require('./models/Post');

const IMAGES = [
  // Using picsum.photos placeholders (no Cloudinary account needed)
  { url: 'https://picsum.photos/seed/prop1/800/600', publicId: 'dummy/prop1' },
  { url: 'https://picsum.photos/seed/prop2/800/600', publicId: 'dummy/prop2' },
  { url: 'https://picsum.photos/seed/prop3/800/600', publicId: 'dummy/prop3' },
  { url: 'https://picsum.photos/seed/prop4/800/600', publicId: 'dummy/prop4' },
  { url: 'https://picsum.photos/seed/prop5/800/600', publicId: 'dummy/prop5' },
];

const properties = [
  // ── RENT ──────────────────────────────────────────────────────────────────
  {
    slug: 'furnished-2bed-apartment-gulberg-lahore',
    title: '2 Bedroom Furnished Apartment in Gulberg, Lahore',
    description:
      'Beautifully furnished 2-bedroom apartment on the 5th floor in the heart of Gulberg. Features modern kitchen, 24/7 security, backup generator, and covered parking. Ideal for professionals and small families seeking a comfortable urban lifestyle.',
    purpose: 'RENT',
    type: 'APARTMENT',
    price: 65000,
    area: 8,
    areaUnit: 'MARLA',
    bedrooms: 2,
    bathrooms: 2,
    floors: 1,
    furnishing: 'FURNISHED',
    buildYear: 2019,
    city: 'Lahore',
    areaName: 'Gulberg III',
    address: 'Main Boulevard, Gulberg III, Lahore',
    latitude: 31.5176,
    longitude: 74.3434,
    images: [IMAGES[0], IMAGES[1], IMAGES[2]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03001234567'],
    amenities: ['Generator', 'CCTV', 'Elevator', 'Parking'],
    features: {
      flooring: 'Tiles',
      electricityBackup: 'Generator',
      parkingSpaces: 1,
      centralAirConditioning: true,
      broadbandInternet: true,
      satelliteOrCableTv: true,
      securityStaff: true,
    },
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    slug: 'unfurnished-3bed-house-dha-karachi',
    title: '3 Bedroom House for Rent in DHA Phase 6, Karachi',
    description:
      'Spacious unfurnished 3-bedroom house in DHA Phase 6 with servant quarters, large lawn, and double car porch. Close to schools, hospitals, and shopping centres. Available for long-term rental.',
    purpose: 'RENT',
    type: 'HOUSE',
    price: 120000,
    area: 10,
    areaUnit: 'MARLA',
    bedrooms: 3,
    bathrooms: 3,
    floors: 2,
    furnishing: 'UNFURNISHED',
    buildYear: 2015,
    city: 'Karachi',
    areaName: 'DHA Phase 6',
    address: 'Street 5, DHA Phase 6, Karachi',
    latitude: 24.8163,
    longitude: 67.0791,
    images: [IMAGES[1], IMAGES[2], IMAGES[3]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03112345678'],
    amenities: ['Lawn', 'Servant Quarters', 'Car Porch'],
    features: {
      flooring: 'Marble',
      parkingSpaces: 2,
      nearbySchools: 3,
      nearbyHospitals: 2,
      nearbyShoppingMalls: 1,
      securityStaff: false,
    },
    status: 'ACTIVE',
    isFeatured: false,
  },
  {
    slug: 'semi-furnished-studio-f7-islamabad',
    title: 'Semi-Furnished Studio Apartment in F-7, Islamabad',
    description:
      'Cosy semi-furnished studio apartment in the prime F-7 sector of Islamabad. Walking distance from Jinnah Super Market. Includes bed, wardrobes, and kitchen fittings. Utilities included in rent.',
    purpose: 'RENT',
    type: 'APARTMENT',
    price: 38000,
    area: 3,
    areaUnit: 'MARLA',
    bedrooms: 1,
    bathrooms: 1,
    floors: 1,
    furnishing: 'SEMI_FURNISHED',
    buildYear: 2018,
    city: 'Islamabad',
    areaName: 'F-7',
    address: 'F-7/1, Islamabad',
    latitude: 33.7182,
    longitude: 73.0607,
    images: [IMAGES[2], IMAGES[3]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03211234567'],
    amenities: ['Elevator', 'Parking', 'CCTV'],
    features: {
      flooring: 'Wooden',
      electricityBackup: 'UPS',
      broadbandInternet: true,
      parkingSpaces: 1,
    },
    status: 'ACTIVE',
    isFeatured: false,
  },
  {
    slug: 'furnished-upper-portion-johar-town-lahore',
    title: 'Furnished Upper Portion for Rent in Johar Town, Lahore',
    description:
      'Well-maintained furnished upper portion with 4 bedrooms in Johar Town. Separate entrance, rooftop access, and modern fittings. Located near Expo Centre and Emporium Mall.',
    purpose: 'RENT',
    type: 'UPPER_PORTION',
    price: 85000,
    area: 10,
    areaUnit: 'MARLA',
    bedrooms: 4,
    bathrooms: 3,
    furnishing: 'FURNISHED',
    buildYear: 2017,
    city: 'Lahore',
    areaName: 'Johar Town',
    address: 'Block J, Johar Town, Lahore',
    latitude: 31.4697,
    longitude: 74.2728,
    images: [IMAGES[3], IMAGES[0], IMAGES[1]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03321234567'],
    amenities: ['Generator', 'Rooftop', 'Parking'],
    features: {
      flooring: 'Tiles',
      electricityBackup: 'Generator',
      parkingSpaces: 1,
      satelliteOrCableTv: true,
    },
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    slug: 'unfurnished-office-space-blue-area-islamabad',
    title: 'Commercial Office Space for Rent in Blue Area, Islamabad',
    description:
      'Modern unfurnished office space of 1,200 sqft on the 3rd floor of a commercial plaza in Blue Area. Open-plan layout, glass partitions available, 24/7 power backup, and dedicated high-speed internet.',
    purpose: 'RENT',
    type: 'OFFICE',
    price: 150000,
    area: 1200,
    areaUnit: 'SQFT',
    bedrooms: 0,
    bathrooms: 2,
    furnishing: 'UNFURNISHED',
    buildYear: 2020,
    city: 'Islamabad',
    areaName: 'Blue Area',
    address: 'Jinnah Avenue, Blue Area, Islamabad',
    latitude: 33.7099,
    longitude: 73.0547,
    images: [IMAGES[4], IMAGES[0]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03451234567'],
    amenities: ['Elevator', 'Power Backup', 'CCTV', 'Parking'],
    features: {
      flooring: 'Tiles',
      electricityBackup: 'Generator',
      elevatorOrLift: true,
      parkingSpaces: 2,
      broadbandInternet: true,
      maintenanceStaff: true,
      securityStaff: true,
    },
    status: 'ACTIVE',
    isFeatured: false,
  },

  // ── BUY / SALE ─────────────────────────────────────────────────────────────
  {
    slug: '5-marla-residential-plot-bahria-town-lahore',
    title: '5 Marla Residential Plot in Bahria Town, Lahore',
    description:
      'Prime 5 Marla residential plot in Bahria Town Sector C, Lahore. Ideal for immediate construction. All utilities available. Quiet street with beautiful park nearby. Plot is corner with extra space.',
    purpose: 'SALE',
    type: 'RESIDENTIAL_PLOT',
    price: 7500000,
    area: 5,
    areaUnit: 'MARLA',
    city: 'Lahore',
    areaName: 'Bahria Town',
    address: 'Sector C, Bahria Town, Lahore',
    latitude: 31.3671,
    longitude: 74.1768,
    images: [IMAGES[0], IMAGES[4]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03561234567'],
    amenities: ['Park Facing', 'Corner Plot', 'Utilities Available'],
    features: {
      nearbySchools: 2,
      nearbyShoppingMalls: 1,
    },
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    slug: '1-kanal-house-dha-phase-5-lahore',
    title: '1 Kanal Modern House for Sale in DHA Phase 5, Lahore',
    description:
      'Stunning 1 Kanal fully furnished house in DHA Phase 5 with 5 bedrooms, home theatre, swimming pool, and landscaped garden. Premium marble flooring, imported kitchen, and solar system installed. Owner built with no compromise on quality.',
    purpose: 'SALE',
    type: 'HOUSE',
    price: 75000000,
    area: 1,
    areaUnit: 'KANAL',
    bedrooms: 5,
    bathrooms: 6,
    floors: 2,
    furnishing: 'FURNISHED',
    buildYear: 2021,
    city: 'Lahore',
    areaName: 'DHA Phase 5',
    address: 'Block L, DHA Phase 5, Lahore',
    latitude: 31.4771,
    longitude: 74.3832,
    images: [IMAGES[1], IMAGES[2], IMAGES[3], IMAGES[4]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03671234567'],
    amenities: ['Swimming Pool', 'Home Theatre', 'Solar System', 'Servant Quarters', 'Lawn'],
    features: {
      flooring: 'Imported Marble',
      electricityBackup: 'Solar + Generator',
      parkingSpaces: 4,
      centralAirConditioning: true,
      centralHeating: true,
      nearbySchools: 5,
      nearbyHospitals: 3,
      nearbyShoppingMalls: 4,
      maintenanceStaff: true,
      securityStaff: true,
    },
    status: 'ACTIVE',
    isFeatured: true,
    isSponsored: true,
  },
  {
    slug: '10-marla-apartment-e11-islamabad',
    title: '10 Marla Semi-Furnished Apartment in E-11, Islamabad',
    description:
      '3-bedroom semi-furnished apartment with breathtaking Margalla Hills view from the 8th floor in E-11. Community amenities include gym, rooftop lounge, and indoor swimming pool. Ideal for working families.',
    purpose: 'SALE',
    type: 'APARTMENT',
    price: 22000000,
    area: 10,
    areaUnit: 'MARLA',
    bedrooms: 3,
    bathrooms: 3,
    floors: 1,
    furnishing: 'SEMI_FURNISHED',
    buildYear: 2022,
    city: 'Islamabad',
    areaName: 'E-11',
    address: 'E-11/2, Islamabad',
    latitude: 33.7255,
    longitude: 72.9987,
    images: [IMAGES[2], IMAGES[0], IMAGES[1]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03781234567'],
    amenities: ['Gym', 'Swimming Pool', 'Rooftop Lounge', 'Elevator', '24/7 Security'],
    features: {
      flooring: 'Tiles',
      electricityBackup: 'Generator',
      parkingSpaces: 2,
      elevatorOrLift: true,
      centralAirConditioning: true,
      broadbandInternet: true,
      maintenanceStaff: true,
      securityStaff: true,
      nearbySchools: 4,
      nearbyHospitals: 2,
    },
    status: 'ACTIVE',
    isFeatured: false,
  },
  {
    slug: 'commercial-plot-mm-alam-road-lahore',
    title: 'Commercial Plot on MM Alam Road, Gulberg, Lahore',
    description:
      'Rare opportunity to own a 4 Marla commercial plot on the most sought-after MM Alam Road in Gulberg. High foot traffic, surrounded by premium restaurants and retail brands. Ideal for building a multi-storey commercial plaza.',
    purpose: 'SALE',
    type: 'COMMERCIAL_PLOT',
    price: 35000000,
    area: 4,
    areaUnit: 'MARLA',
    city: 'Lahore',
    areaName: 'MM Alam Road, Gulberg',
    address: 'MM Alam Road, Gulberg II, Lahore',
    latitude: 31.5109,
    longitude: 74.3368,
    images: [IMAGES[3], IMAGES[4]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03891234567'],
    amenities: ['Main Road Facing', 'High Visibility', 'All Utilities'],
    features: {},
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    slug: '2-bed-apartment-clifton-karachi',
    title: '2 Bed Unfurnished Apartment for Sale in Clifton, Karachi',
    description:
      'Well-located 2-bedroom unfurnished apartment on the 4th floor in Block 4, Clifton. Sea view from the balcony, building has gym and swimming pool. Easy access to major roads and business hubs.',
    purpose: 'SALE',
    type: 'APARTMENT',
    price: 18500000,
    area: 1500,
    areaUnit: 'SQFT',
    bedrooms: 2,
    bathrooms: 2,
    floors: 1,
    furnishing: 'UNFURNISHED',
    buildYear: 2016,
    city: 'Karachi',
    areaName: 'Clifton Block 4',
    address: 'Block 4, Clifton, Karachi',
    latitude: 24.8137,
    longitude: 67.0299,
    images: [IMAGES[4], IMAGES[1], IMAGES[2]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03901234567'],
    amenities: ['Sea View', 'Gym', 'Swimming Pool', 'Generator'],
    features: {
      flooring: 'Tiles',
      electricityBackup: 'Generator',
      elevatorOrLift: true,
      parkingSpaces: 1,
      centralAirConditioning: false,
      nearbySchools: 3,
      nearbyShoppingMalls: 2,
    },
    status: 'ACTIVE',
    isFeatured: false,
  },
  {
    slug: '4-marla-shop-liberty-market-lahore',
    title: '4 Marla Shop for Sale in Liberty Market, Lahore',
    description:
      'Ground floor shop in Liberty Market — one of Lahore\'s busiest commercial zones. Existing tenant in place with strong rental yield. Corner unit with maximum visibility. Perfect for investors.',
    purpose: 'SALE',
    type: 'SHOP',
    price: 28000000,
    area: 4,
    areaUnit: 'MARLA',
    furnishing: 'UNFURNISHED',
    buildYear: 2010,
    city: 'Lahore',
    areaName: 'Liberty Market',
    address: 'Main Liberty Market, Gulberg III, Lahore',
    latitude: 31.5263,
    longitude: 74.3378,
    images: [IMAGES[0], IMAGES[3]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03011234567'],
    amenities: ['Main Road Facing', 'Corner Unit', 'High Footfall'],
    features: {
      flooring: 'Tiles',
      electricityBackup: 'WAPDA',
    },
    status: 'ACTIVE',
    isFeatured: false,
  },
  {
    slug: '20-marla-farmhouse-bedian-road-lahore',
    title: '20 Marla Farmhouse for Sale on Bedian Road, Lahore',
    description:
      'Lush 20 Marla farmhouse on Bedian Road with fruit orchards, fish pond, and outdoor BBQ area. 3 bedrooms with rustic interiors, fully furnished. Perfect weekend retreat with easy access from the city.',
    purpose: 'SALE',
    type: 'FARMHOUSE',
    price: 30000000,
    area: 20,
    areaUnit: 'MARLA',
    bedrooms: 3,
    bathrooms: 3,
    furnishing: 'FURNISHED',
    buildYear: 2018,
    city: 'Lahore',
    areaName: 'Bedian Road',
    address: 'Bedian Road, Lahore',
    latitude: 31.3926,
    longitude: 74.5043,
    images: [IMAGES[1], IMAGES[4], IMAGES[0]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03121234567'],
    amenities: ['Fish Pond', 'Orchard', 'BBQ Area', 'Lawn', 'Generator'],
    features: {
      flooring: 'Stone',
      electricityBackup: 'Solar + Generator',
      parkingSpaces: 5,
      nearbyRestaurants: 2,
    },
    status: 'ACTIVE',
    isFeatured: false,
  },
  {
    slug: '1-kanal-plot-dha-phase-8-lahore',
    title: '1 Kanal Plot for Sale in DHA Phase 8, Lahore',
    description:
      'Prime location 1 Kanal residential plot in DHA Phase 8, Block W. Park-facing with no construction on front and back. All utilities available including sui gas. Ideal for owner-build or investment.',
    purpose: 'SALE',
    type: 'RESIDENTIAL_PLOT',
    price: 45000000,
    area: 1,
    areaUnit: 'KANAL',
    city: 'Lahore',
    areaName: 'DHA Phase 8',
    address: 'Block W, DHA Phase 8, Lahore',
    latitude: 31.4303,
    longitude: 74.4371,
    images: [IMAGES[2], IMAGES[3]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03231234567'],
    amenities: ['Park Facing', 'All Utilities', 'Quiet Street'],
    features: {
      nearbySchools: 3,
      nearbyHospitals: 1,
      nearbyShoppingMalls: 2,
    },
    status: 'ACTIVE',
    isFeatured: true,
  },
  {
    slug: 'penthouse-bahria-town-rawalpindi',
    title: 'Luxury Penthouse in Bahria Town, Rawalpindi',
    description:
      'Exclusive fully furnished penthouse on the top floor of Bahria Heights. Private rooftop terrace with panoramic views, home automation, Italian kitchen, and private lift access. One of a kind.',
    purpose: 'SALE',
    type: 'PENTHOUSE',
    price: 90000000,
    area: 2500,
    areaUnit: 'SQFT',
    bedrooms: 4,
    bathrooms: 5,
    floors: 2,
    furnishing: 'FURNISHED',
    buildYear: 2023,
    city: 'Rawalpindi',
    areaName: 'Bahria Town Phase 4',
    address: 'Bahria Heights, Phase 4, Rawalpindi',
    latitude: 33.5082,
    longitude: 73.1194,
    images: [IMAGES[3], IMAGES[1], IMAGES[2], IMAGES[4]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03341234567'],
    amenities: ['Private Rooftop', 'Home Automation', 'Private Lift', 'Gym', 'Swimming Pool'],
    features: {
      flooring: 'Italian Marble',
      electricityBackup: 'Solar + Generator',
      parkingSpaces: 3,
      centralAirConditioning: true,
      centralHeating: true,
      elevatorOrLift: true,
      broadbandInternet: true,
      satelliteOrCableTv: true,
      maintenanceStaff: true,
      securityStaff: true,
    },
    status: 'ACTIVE',
    isFeatured: true,
    isSponsored: true,
  },
  {
    slug: 'warehouse-korangi-industrial-area-karachi',
    title: 'Warehouse for Sale in Korangi Industrial Area, Karachi',
    description:
      'Large 5 Kanal warehouse in Korangi Industrial Area with 30ft ceiling height, loading dock, 3-phase electricity, and separate admin block. Suitable for manufacturing, logistics, or storage. Currently vacant and ready for possession.',
    purpose: 'SALE',
    type: 'WAREHOUSE',
    price: 120000000,
    area: 5,
    areaUnit: 'KANAL',
    bedrooms: 0,
    bathrooms: 3,
    furnishing: 'UNFURNISHED',
    buildYear: 2012,
    city: 'Karachi',
    areaName: 'Korangi Industrial Area',
    address: 'Sector 35, Korangi Industrial Area, Karachi',
    latitude: 24.8389,
    longitude: 67.1159,
    images: [IMAGES[4], IMAGES[0], IMAGES[1]],
    contactEmail: 'dealer@arze.pk',
    contactMobiles: ['03451234568'],
    amenities: ['Loading Dock', '3-Phase Electricity', 'Admin Block', 'CCTV'],
    features: {
      flooring: 'Concrete',
      electricityBackup: 'Generator',
      parkingSpaces: 10,
      maintenanceStaff: false,
      securityStaff: true,
    },
    status: 'ACTIVE',
    isFeatured: false,
  },
];

// ── Dummy blog post ───────────────────────────────────────────────────────
const BLOG_POST = {
  title: 'Pakistan Real Estate 2025: Top Cities, Price Trends & Buying Tips',
  slug:  'pakistan-real-estate-2025-top-cities-price-trends-buying-tips',
  image: 'https://picsum.photos/seed/blog-realestate/1200/630',
  category: 'Market Insights',
  tags: ['Real Estate', 'Pakistan', 'Property Investment', 'Lahore', 'Karachi', 'Islamabad', 'Buying Guide'],
  metaTitle: 'Pakistan Real Estate 2025 — Top Cities, Prices & Investment Tips | ArzePak',
  metaDescription: 'Explore the latest property market trends across Lahore, Karachi and Islamabad in 2025. Find out where to invest, average prices per marla, and expert tips for first-time buyers.',
  body: `<h2>Pakistan Real Estate in 2025: What You Need to Know</h2>

<p>Pakistan's property market has always been one of the most resilient asset classes for local investors. Despite economic headwinds over the past few years, demand for residential and commercial real estate continues to grow — driven by urbanisation, a young population, and a chronic shortage of housing units across major cities.</p>

<p>Whether you're a first-time buyer, a seasoned investor, or simply exploring your options, understanding the current landscape is critical before committing your hard-earned money. In this guide, we break down the top three cities, average price benchmarks, and practical tips to help you make a smarter decision in 2025.</p>

<img src="https://picsum.photos/seed/blog-city/1200/500" alt="Pakistan skyline" style="width:100%;border-radius:12px;margin:24px 0;" />

<h2>Top 3 Cities to Watch in 2025</h2>

<h3>1. Lahore — The King of Residential Demand</h3>
<p>Lahore remains the undisputed leader in residential property transactions. DHA Lahore and Bahria Town continue to set price benchmarks, while newer schemes like Lake City and Lahore Smart City are attracting both local and overseas Pakistani investment.</p>

<ul>
  <li><strong>5 Marla plot (DHA Phase 5):</strong> PKR 1.2 Cr – 1.6 Cr</li>
  <li><strong>10 Marla house (Bahria Town):</strong> PKR 2.8 Cr – 4.0 Cr</li>
  <li><strong>2-bed apartment (Gulberg):</strong> PKR 55,000 – 90,000/month rent</li>
</ul>

<p><strong>Key driver:</strong> Lahore's expanding ring road network and CPEC-linked industrial zones are pushing demand outward, making peripheral societies attractive for medium-term capital gain.</p>

<h3>2. Karachi — Commercial Capital, Resilient Market</h3>
<p>Despite infrastructural challenges, Karachi's property market remains highly liquid. DHA Karachi — particularly Phase 6, 7, and 8 — continues to attract corporate buyers. Clifton and Bath Island command premium prices for apartment living.</p>

<ul>
  <li><strong>5 Marla plot (DHA Phase 8):</strong> PKR 90 Lac – 1.3 Cr</li>
  <li><strong>1,000 sqft apartment (Clifton):</strong> PKR 1.5 Cr – 2.5 Cr</li>
  <li><strong>Commercial shop (II Chundrigar Road):</strong> PKR 3 Cr – 8 Cr</li>
</ul>

<p><strong>Key driver:</strong> The Karachi Circular Railway revival and port-adjacent logistics growth are boosting commercial land values in the city's eastern and western corridors.</p>

<h3>3. Islamabad — Premium Living, Steady Appreciation</h3>
<p>The federal capital offers the highest quality of life among Pakistan's major cities. Sectors F-7, E-11, and G-13 are perennial favourites, while new housing schemes along the Motorway corridor — such as Capital Smart City — continue to attract long-term investors.</p>

<ul>
  <li><strong>1 Kanal plot (F-7):</strong> PKR 12 Cr – 20 Cr</li>
  <li><strong>10 Marla house (G-13):</strong> PKR 4.5 Cr – 7 Cr</li>
  <li><strong>Studio apartment (E-11):</strong> PKR 35,000 – 55,000/month rent</li>
</ul>

<p><strong>Key driver:</strong> NDMA approvals for new housing societies and the growing tech/startup ecosystem are fuelling demand for modern apartment living among younger professionals.</p>

<img src="https://picsum.photos/seed/blog-invest/1200/500" alt="Real estate investment" style="width:100%;border-radius:12px;margin:24px 0;" />

<h2>Price Trends: What's Going Up, What's Stabilising</h2>

<p>After the sharp corrections of 2022–2023, the property market has entered a phase of selective recovery. Here's a snapshot:</p>

<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <thead>
    <tr style="background:#f0fdf4;">
      <th style="padding:10px 14px;text-align:left;border:1px solid #e5e7eb;">Segment</th>
      <th style="padding:10px 14px;text-align:left;border:1px solid #e5e7eb;">Trend (2024–2025)</th>
      <th style="padding:10px 14px;text-align:left;border:1px solid #e5e7eb;">Outlook</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Residential plots (DHA/Bahria)</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">+12–18% YoY</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Bullish</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Apartments (major cities)</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">+6–10% YoY</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Stable</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Commercial plots (city centre)</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">+20–30% YoY</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Very Bullish</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Rental yields (residential)</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">3–5% annually</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Improving</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">New project launches</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">High supply</td>
      <td style="padding:10px 14px;border:1px solid #e5e7eb;">Buyer-friendly</td>
    </tr>
  </tbody>
</table>

<h2>7 Practical Tips for First-Time Buyers</h2>

<ol>
  <li><strong>Verify the title deed (Fard).</strong> Always obtain a fresh Fard from the local Patwari or LESCO/WAPDA to confirm ownership before paying any token money.</li>
  <li><strong>Check NOC and society approval.</strong> Ensure the housing society is approved by LDA (Lahore), KDA (Karachi), or CDA (Islamabad). Unapproved schemes carry significant legal risk.</li>
  <li><strong>Budget for hidden costs.</strong> Transfer fees, stamp duty, and dealer commission can add 5–8% to the purchase price. Factor these in from the start.</li>
  <li><strong>Don't skip a physical visit.</strong> Online listings can be outdated or misleading. Visit the property and surrounding area at different times of day.</li>
  <li><strong>Negotiate — the market expects it.</strong> Most listed prices have 5–15% negotiation room built in, especially for properties listed for over 60 days.</li>
  <li><strong>Consider rental yield, not just appreciation.</strong> A property in a mature area (DHA, Gulberg) may appreciate slower than a new scheme but will generate consistent rental income from day one.</li>
  <li><strong>Use a verified dealer.</strong> Work with registered dealers who are accountable and have verifiable track records. ArzePak lists only verified, background-checked agents.</li>
</ol>

<img src="https://picsum.photos/seed/blog-tips/1200/500" alt="Home buying tips" style="width:100%;border-radius:12px;margin:24px 0;" />

<h2>Frequently Asked Questions</h2>

<h3>Is now a good time to buy property in Pakistan?</h3>
<p>With interest rates beginning to ease and the PKR stabilising, 2025 is generally considered a better entry point than 2022 or 2023. Prices in premium societies have recovered but have not yet reached peak levels, offering a window for smart buyers.</p>

<h3>What documents do I need to buy property in Pakistan?</h3>
<p>You will need your CNIC (or NICOP for overseas Pakistanis), the seller's title deed, a fresh Fard, a sale agreement drafted by a lawyer, and proof of funds. For plot files, an allotment letter and possession letter are also required.</p>

<h3>Can overseas Pakistanis buy property in Pakistan?</h3>
<p>Yes. Overseas Pakistanis with a valid NICOP can purchase property in Pakistan. Many developers offer dedicated overseas quotas with flexible instalment plans and remote booking facilities.</p>

<h3>What is the difference between a Marla and a Kanal?</h3>
<p>In Pakistan's property system, 1 Kanal = 20 Marla. A standard Marla is approximately 272 square feet (25.3 sq metres). So 1 Kanal ≈ 5,445 sq ft or 506 sq metres.</p>

<p style="margin-top:32px;padding:16px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;">
  <strong>Ready to find your next property?</strong> Browse thousands of verified listings across Pakistan on ArzePak — filter by city, price, size, and property type to find exactly what you're looking for.
</p>`,
  faqs: [
    {
      question: 'Is now a good time to buy property in Pakistan?',
      answer: 'With interest rates easing and the PKR stabilising, 2025 is generally a better entry point than 2022–2023. Prices in premium societies have recovered but have not yet reached peak levels.',
    },
    {
      question: 'What documents are needed to buy property in Pakistan?',
      answer: 'You need your CNIC (or NICOP for overseas Pakistanis), the seller\'s title deed, a fresh Fard, a sale agreement, and proof of funds.',
    },
    {
      question: 'Can overseas Pakistanis buy property in Pakistan?',
      answer: 'Yes. Overseas Pakistanis with a valid NICOP can purchase property. Many developers offer overseas quotas with flexible instalment plans.',
    },
    {
      question: 'What is the difference between a Marla and a Kanal?',
      answer: '1 Kanal = 20 Marla. A standard Marla is approximately 272 sq ft. So 1 Kanal ≈ 5,445 sq ft.',
    },
  ],
};

// ── Dummy dealer config ────────────────────────────────────────────────────
const DUMMY_DEALER_EMAIL = 'dummydealer@arze.pk';
const DUMMY_DEALER = {
  agencyName: 'ArzePak Realty',
  bio: 'Pakistan\'s most trusted real estate agency with over 10 years of experience in residential, commercial, and plot sales across major cities.',
  whatsapp:  '923001234567',   // country code 92 + number (no +, no dashes) — used for wa.me links
  phone:     '03001234567',    // local format — used for tel: links
  city: 'Lahore',
  areasServed: ['DHA Lahore', 'Bahria Town Lahore', 'Gulberg', 'DHA Karachi', 'Clifton', 'F-7 Islamabad', 'E-11 Islamabad'],
  experience: 12,
  isVerified: true,
  status: 'ACTIVE',
};

async function getOrCreateDummyDealer() {
  // Check if dummy user already exists
  let user = await User.findOne({ email: DUMMY_DEALER_EMAIL });
  if (!user) {
    user = await User.create({
      name: 'ArzePak Realty',
      email: DUMMY_DEALER_EMAIL,
      password: 'DummyPass@123',
      role: 'DEALER',
      isVerified: true,
    });
    console.log('  ✅ Created dummy dealer user');
  } else {
    console.log('  ⏭  Dummy dealer user already exists');
  }

  let dealer = await Dealer.findOne({ userId: user._id });
  if (!dealer) {
    dealer = await Dealer.create({ userId: user._id, ...DUMMY_DEALER });
    console.log('  ✅ Created dummy dealer profile');
  } else {
    // Update phone/whatsapp in case they were missing
    await Dealer.findByIdAndUpdate(dealer._id, {
      whatsapp: DUMMY_DEALER.whatsapp,
      phone: DUMMY_DEALER.phone,
      isVerified: true,
      status: 'ACTIVE',
    });
    console.log('  ⏭  Dummy dealer already exists — updated whatsapp/phone');
  }

  return { userId: user._id, dealerId: dealer._id };
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    console.log('\n── Creating dummy dealer ──');
    const { userId, dealerId } = await getOrCreateDummyDealer();

    console.log('\n── Seeding properties ──');
    let inserted = 0;
    let skipped = 0;

    for (const prop of properties) {
      const exists = await Property.findOne({ slug: prop.slug });
      if (exists) {
        // Update existing to link dealer + add phone numbers if missing
        await Property.findOneAndUpdate({ slug: prop.slug }, {
          dealerId,
          userId,
          contactMobiles: ['03001234567'],
          status: 'ACTIVE',
        });
        console.log(`  ⏭  Updated (dealer linked): ${prop.slug}`);
        skipped++;
        continue;
      }
      await Property.create({
        ...prop,
        dealerId,
        userId,
        contactMobiles: prop.contactMobiles?.length ? prop.contactMobiles : ['03001234567'],
        status: 'ACTIVE',
      });
      console.log(`  ✅ Inserted: ${prop.slug}`);
      inserted++;
    }

    console.log(`\nDone — ${inserted} inserted, ${skipped} updated/skipped.`);

    console.log('\n── Seeding blog post ──');
    const existingPost = await Post.findOne({ slug: BLOG_POST.slug });
    if (existingPost) {
      console.log('  ⏭  Blog post already exists — skipped');
    } else {
      await Post.create(BLOG_POST);
      console.log('  ✅ Blog post inserted');
    }

    console.log(`\nDealer WhatsApp: ${DUMMY_DEALER.whatsapp}`);
    console.log(`Dealer Phone:    ${DUMMY_DEALER.phone}`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
