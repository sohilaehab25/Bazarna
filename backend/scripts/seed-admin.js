require('dotenv/config');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const ADMIN_NAME = (process.env.SEED_ADMIN_NAME || 'Bazarna Admin').trim();
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@bazarna.local').trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.SEED_ADMIN_PASSWORD || 'Admin@12345').trim();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cute_bazar';

if (ADMIN_PASSWORD.length < 8) {
  console.error('SEED_ADMIN_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

const User = mongoose.models.SeedUser || mongoose.model('SeedUser', userSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existingUser = await User.findOne({ email: ADMIN_EMAIL });

  if (existingUser) {
    existingUser.name = ADMIN_NAME;
    existingUser.password = passwordHash;
    existingUser.role = 'admin';
    existingUser.isVerified = true;
    existingUser.emailVerificationToken = undefined;
    existingUser.emailVerificationExpires = undefined;
    await existingUser.save();
    console.log(`Updated existing admin user: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: 'admin',
      isVerified: true,
    });
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
  console.log('Admin seeding completed successfully.');
}

run().catch(async (error) => {
  console.error('Admin seeding failed.', error);
  await mongoose.disconnect();
  process.exit(1);
});
