import { PrismaClient, UserRole } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:123456@localhost:5433/restaurant_saas?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'superadmin@gmail.com';
  const rawPassword = 'superadmin123';
  const rawPin = '1234';

  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const hashedPin = await bcrypt.hash(rawPin, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      pin: hashedPin,
      role: UserRole.super_admin,
      isActive: true,
    },
    create: {
      name: 'Super Admin',
      email,
      password: hashedPassword,
      pin: hashedPin,
      role: UserRole.super_admin,
      isActive: true,
    },
  });

  console.log('✅ Super Admin Created/Updated Successfully:');
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Password: ${rawPassword}`);
  console.log(`   PIN: ${rawPin}`);
  console.log(`   Role: ${superAdmin.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
