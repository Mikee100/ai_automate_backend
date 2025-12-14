import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================
  // SECURITY: Helmet.js - Security Headers
  // ============================================
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for webhooks
  }));

  // ============================================
  // SECURITY: Request Size Limits
  // ============================================
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // ============================================
  // SECURITY: Global Input Validation
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide error details in production
    }),
  );

  // Set global prefix for API routes, excluding webhook routes
  app.setGlobalPrefix('api', {
    exclude: [
      '',
      '/',
      'webhooks/whatsapp',
      'webhooks/whatsapp/*',
      'webhooks/instagram',
      'webhooks/messenger',
      'webhooks/*',
      'admin/queues',
      'admin/queues/*',
    ]
  });

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5000',
      'http://localhost:8080',
      'http://localhost:3001',
      'http://localhost:3000',
      'https://fiestahouse.vercel.app',
      'https://fiesta-house-maternity.vercel.app',
      'https://fiesta-house.duckdns.org',
    ], // Vite dev server and omniconnect-suite
    credentials: true,
  });

  // Setup Bull Board dashboard
  try {
    const { setupBullBoard } = await import('./bull-board');
    setupBullBoard(app);
    console.log('Bull Board dashboard available at /admin/queues');
  } catch (err) {
    console.warn('Bull Board dashboard setup failed:', err);
  }

  await app.listen(3000);
  console.log('Application started successfully');
  console.log(JSON.stringify({ message: 'Fiesta House APIs is running 🚀' }));
}
bootstrap();
