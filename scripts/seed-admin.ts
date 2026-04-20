import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../src/lib/db';
import { AdminUser } from '../src/models/AdminUser';

async function main() {
  await connectToDatabase();

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@masjid.com';
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 12);

  await AdminUser.findOneAndUpdate(
    { email },
    {
      name: 'Masjid Admin',
      email,
      passwordHash,
      role: 'admin'
    },
    { upsert: true, new: true }
  );

  console.log(`Seeded admin account: ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
