import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Business, BusinessSchema } from './business.schema';
import { UsersModule } from '../users/users.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]),
    UsersModule,
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
