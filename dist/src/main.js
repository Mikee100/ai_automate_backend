"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
const express = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
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
        ],
        credentials: true,
    });
    try {
        const { setupBullBoard } = await Promise.resolve().then(() => require('./bull-board'));
        setupBullBoard(app);
        console.log('Bull Board dashboard available at /admin/queues');
    }
    catch (err) {
        console.warn('Bull Board dashboard setup failed:', err);
    }
    await app.listen(3000);
    console.log('Application started successfully');
    console.log(JSON.stringify({ message: 'Fiesta House APIs is running 🚀' }));
}
bootstrap();
//# sourceMappingURL=main.js.map