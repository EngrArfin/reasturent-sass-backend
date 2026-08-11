import { PrismaClient, UserRole } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';
import * as dns from 'dns';

async function main() {
  const connectionString = process.env.DATABASE_URL!;
  const url = new URL(connectionString);
  const ipv4Addresses = await dns.promises.resolve4(url.hostname);
  const hostIp = ipv4Addresses[0];

  const pool = new Pool({
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: hostIp,
    port: parseInt(url.port || '5432'),
    database: url.pathname.slice(1),
    ssl: {
      rejectUnauthorized: false,
      servername: url.hostname,
    },
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const email = 'superadmin@gmail.com';
  const rawPassword = 'superadmin123';
  const rawPin = '1234';

  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const hashedPin = await bcrypt.hash(rawPin, 10);

  try {
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
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
