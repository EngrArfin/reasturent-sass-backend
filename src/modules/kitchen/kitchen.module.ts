import { Module } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KitchenController],
  providers: [KitchenService],
  exports: [KitchenService],
})
export class KitchenModule {}
