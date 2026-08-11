import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

let cachedNeonIp: string | null = null;
const envUrl = process.env.DATABASE_URL;
if (envUrl && (envUrl.includes('neon.tech') || envUrl.includes('sslmode=require'))) {
  try {
    const parsedUrl = new URL(envUrl);
    dns.resolve4(parsedUrl.hostname, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        cachedNeonIp = addresses[0];
      }
    });
  } catch (e) {}
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;
  private isNeon: boolean;
  private neonHostname: string | null = null;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:123456@localhost:5433/restaurant_saas?schema=public';
    const isNeon =
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require');

    let pool: Pool;
    let neonHostname: string | null = null;

    if (isNeon) {
      const url = new URL(connectionString);
      neonHostname = url.hostname;
      const hostIp = cachedNeonIp || url.hostname;
      pool = new Pool({
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
    } else {
      pool = new Pool({ connectionString });
    }

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
    this.isNeon = isNeon;
    this.neonHostname = neonHostname;
  }

  async onModuleInit() {
    if (this.isNeon && this.neonHostname) {
      try {
        const ips = await dns.promises.resolve4(this.neonHostname);
        if (ips && ips.length > 0) {
          cachedNeonIp = ips[0];
          (this.pool as any).options.host = ips[0];
        }
      } catch (e) {}
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
