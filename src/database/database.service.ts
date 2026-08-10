import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    console.log('Database connected successfully');
  }

  getPrisma(): PrismaService {
    return this.prisma;
  }
}

