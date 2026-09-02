import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS for frontend applications
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 2. Enable Global Exception Filter to properly handle ALL errors (HTTP, Prisma, DB, System)
  app.useGlobalFilters(new AllExceptionsFilter());

  // 3. Enable Global Validation Pipe with structured field-level error messages
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
    .setVersion('1.0')
    .addTag('Auth', 'Authentication & User Profile Operations')
    .addTag('Admin', 'Super Admin Tenant & Business Management Operations')
    .addTag('Manager - Overview Dashboard', 'Restaurant POS Overview KPI Metrics (Daily Sales, Transactions, Terminals, Orders)')
    .addTag('Manager - Employees Management', 'Restaurant Staff & Employee Management Operations (Cards, Modals, PIN)')
    .addTag('Manager - Inventory & Products', 'Manager Inventory & Product Catalog Management Operations')
    .addTag('Manager - Vouchers & Discounts', 'Restaurant Vouchers, Specials, and Staff Requested Discounts Operations')
    .addTag('Manager & Admin - Support Tickets', 'Support Tickets, Auto-Captured Device Diagnostics, and Live Communication Thread')
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
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger documentation is available at http://localhost:${port}/api`);
}
bootstrap();
