import { PrismaClient, UserRole } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';
import * as dns from 'dns';

async function main() {
  const connectionString = process.env.DATABASE_URL!;
  const url = new URL(connectionString);
  let hostIp = url.hostname;
  if (hostIp === 'localhost') {
    hostIp = '127.0.0.1';
  } else if (!/^[0-9.]+$/.test(hostIp)) {
    try {
      const ipv4Addresses = await dns.promises.resolve4(url.hostname);
      hostIp = ipv4Addresses[0] || url.hostname;
    } catch (e) {
      hostIp = '127.0.0.1';
    }
  }

  const isNeon = connectionString.includes('neon.tech') || connectionString.includes('sslmode=require');
  const pool = new Pool({
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: hostIp,
    port: parseInt(url.port || '5432'),
    database: url.pathname.slice(1),
    ssl: isNeon ? {
      rejectUnauthorized: false,
      servername: url.hostname,
    } : undefined,
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

    // Create or update default demo business
    const demoBusiness = await prisma.business.upsert({
      where: { name: 'foodies-hub' },
      update: {
        businessName: 'Foodies Hub Restaurant',
        email: 'manager@foodieshub.com',
        allowedRoles: ['manager', 'supervisor', 'server', 'kitchen', 'cashier'],
        isActive: true,
      },
      create: {
        name: 'foodies-hub',
        businessName: 'Foodies Hub Restaurant',
        email: 'manager@foodieshub.com',
        phone: '+1 800 555 0199',
        address: '742 Evergreen Terrace, Springfield',
        subscriptionFee: 'CFA 99/mo',
        allowedRoles: ['manager', 'supervisor', 'server', 'kitchen', 'cashier'],
        isActive: true,
      },
    });

    // Seed Demo Users for all roles with PIN 1234
    const demoUsers = [
      { name: 'Restaurant Owner (Supervisor)', email: 'supervisor@foodieshub.com', role: UserRole.supervisor },
      { name: 'Restaurant Manager', email: 'manager@foodieshub.com', role: UserRole.manager },
      { name: 'POS Cashier', email: 'cashier@foodieshub.com', role: UserRole.cashier },
      { name: 'Kitchen Chef', email: 'kitchen@foodieshub.com', role: UserRole.kitchen },
      { name: 'Floor Server', email: 'server@foodieshub.com', role: UserRole.server },
    ];

    for (const u of demoUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          password: hashedPin,
          pin: hashedPin,
          role: u.role,
          businessId: demoBusiness.id,
          isActive: true,
        },
        create: {
          name: u.name,
          email: u.email,
          password: hashedPin,
          pin: hashedPin,
          role: u.role,
          businessId: demoBusiness.id,
          isActive: true,
        },
      });
      console.log(`   User [${u.role}]: ${u.email} (PIN: 1234)`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
