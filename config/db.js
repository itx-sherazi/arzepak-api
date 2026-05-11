const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize:      10,   // max simultaneous connections
      minPoolSize:       2,   // keep 2 connections warm
      socketTimeoutMS: 45000, // close idle socket after 45s
      serverSelectionTimeoutMS: 5000, // fail fast if no server
      heartbeatFrequencyMS: 10000,
    });
    console.log('✅ MongoDB connected');

    mongoose.connection.on('error', (err) => console.error('[MongoDB Error]', err.message));
    mongoose.connection.on('disconnected', () => console.warn('[MongoDB] Disconnected — reconnecting...'));
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
