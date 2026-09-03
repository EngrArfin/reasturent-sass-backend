import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ProductsModule } from './modules/products/products.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { OverviewModule } from './modules/overview/overview.module';
import { TablesModule } from './modules/tables/tables.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { ServeModule } from './modules/serve/serve.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    PrismaModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    SubscriptionPlansModule,
    TicketsModule,
    ProductsModule,
    VouchersModule,
    OverviewModule,
    TablesModule,
    MenuItemsModule,
    OrdersModule,
    KitchenModule,
    ServeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

// @Module({
//   imports: [],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}
