const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');

const ensureDefaultAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@wattarchair.com').toLowerCase();
  let adminPassword = process.env.ADMIN_PASSWORD;
  let generated = false;

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    if (!adminPassword || adminPassword.length < 8) {
      adminPassword = crypto.randomBytes(9).toString('base64url');
      generated = true;
    }

    await User.create({
      name: 'مدير الموقع',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      emailVerified: true,
    });
    console.log('Default admin created successfully.');
    if (generated) {
      console.log(`\n🔐 ADMIN_PASSWORD غير مضبوط. تم توليد كلمة مرور للمدير (تظهر مرة واحدة فقط):\n   ${adminEmail} / ${adminPassword}\n`);
    }
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wattar-chair');
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await ensureDefaultAdmin();
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
