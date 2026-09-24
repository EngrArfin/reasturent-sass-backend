import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

let cachedServer: Express;

async function bootstrapServer(): Promise<Express> {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // 1. Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 2. Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 3. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) => {
        const details = errors.map((err) => ({
          field: err.property,
          errors: Object.values(err.constraints || {}),
        }));
        const messages = errors
          .map((err) => Object.values(err.constraints || {}).join(', '))
          .filter(Boolean);
        return new BadRequestException({
          message: messages.join('; ') || 'Validation failed',
          validationErrors: details,
          error: 'Bad Request',
        });
      },
    }),
  );

  // 4. Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Restaurant SaaS API')
    .setDescription('REST API Documentation for Restaurant SaaS Platform')
    .addTag('Auth & Account Settings', 'Authentication, User Profile, Avatar, Password & PIN Management')
    .addTag('Manager & Staff - Notifications & Activity Alerts', 'Real-time Activity Alerts, Feed Filters (ALL, UNREAD, SYSTEM, TICKETS, ORDERS) & Notification Preferences')
    .addTag('Admin', 'Super Admin Tenant & Business Management Operations')
    .addTag('Subscription Plans', 'SaaS Pricing & Subscription Tier Management')
    .addTag(
      'Manager - Overview Dashboard',
      'Restaurant POS Overview KPI Metrics (Daily Sales, Transactions, Terminals, Orders)',
    )
    .addTag(
      'Manager - Employees Management',
      'Restaurant Staff & Employee Management Operations (Cards, Modals, PIN)',
    )
    .addTag(
      'Manager - Inventory & Products',
      'Manager Inventory & Product Catalog Management Operations',
    )
    .addTag(
      'Manager - Food & Tables',
      'Dining Tables & Seating Management Operations',
    )
    .addTag(
      'Manager - Food & Menu Catalog',
      'Food Dishes, Categories & Recipe Catalog Operations',
    )
    .addTag(
      'Manager - Food & Active Orders',
      'Kitchen & Table Order Processing Operations',
    )
    .addTag(
      'Manager - Vouchers & Discounts',
      'Restaurant Vouchers, Specials, and Staff Requested Discounts Operations',
    )
    .addTag(
      'Manager & Admin - Support Tickets',
      'Support Tickets, Auto-Captured Device Diagnostics, and Live Communication Thread',
    )
    .addTag(
      'Kitchen - Kitchen Production & KDS',
      'Kitchen Display System & Ticket Operations',
    )
    .addTag(
      'Service - Waiter & Server Floor Dashboard',
      'Waiter & Service Floor Table Management',
    )
    .addTag(
      'Cashier - POS Hub & Payment Processing',
      'Cashier Billing & POS Checkout Operations',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const customOptions: SwaggerCustomOptions = {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
  };

  SwaggerModule.setup('api', app, document, customOptions);

  await app.init();
  return expressApp;
}

export default async function handler(req: Request, res: Response) {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return cachedServer(req, res);
}
