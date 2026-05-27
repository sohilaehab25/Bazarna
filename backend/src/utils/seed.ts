import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import UserModel, { UserRole } from '../models/User';

const ADMIN_NAME = process.env.SEED_ADMIN_NAME?.trim() || 'Bazarna Admin';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || 'admin@bazarna.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD?.trim() || 'Admin@12345';

async function seedAdminUser(): Promise<void> {
  await connectDatabase();

  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existingUser = await UserModel.findOne({ email: ADMIN_EMAIL });

  if (existingUser) {
    existingUser.name = ADMIN_NAME;
    existingUser.password = passwordHash;
    existingUser.role = UserRole.ADMIN;
    existingUser.isVerified = true;
    existingUser.emailVerificationToken = undefined;
    existingUser.emailVerificationExpires = undefined;
    await existingUser.save();

    console.log(`Updated existing admin user: ${ADMIN_EMAIL}`);
  } else {
    await UserModel.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: UserRole.ADMIN,
      isVerified: true,
    });

    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }
}

seedAdminUser()
  .then(async () => {
    await disconnectDatabase();
    console.log('Admin seeding completed successfully.');
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Admin seeding failed.', error);
    await disconnectDatabase();
    process.exit(1);
  });
