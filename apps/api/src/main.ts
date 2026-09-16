import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 4000);
  const apiPrefix = configService.get<string>('apiPrefix', '/api/v1');
  const frontendUrl = configService.get<string>('frontendUrl', 'http://localhost:3000');

  // Body parser limits for profile photo uploads (data URLs up to 10MB)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Security Headers
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));

  // CORS Configuration
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global Prefix: /api/v1
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NEO EMS API')
    .setDescription(
      'Production-grade RESTful API for NEO EMS - Employee Management, Attendance, Leaves, Payroll, and Performance.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Enable Graceful Shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 NEO EMS Backend API is running at: http://localhost:${port}/${apiPrefix.replace(/^\//, '')}`);
  logger.log(`📚 OpenAPI / Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
