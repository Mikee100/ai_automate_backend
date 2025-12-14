"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const throttler_1 = require("@nestjs/throttler");
const database_health_1 = require("./indicators/database.health");
const redis_health_1 = require("./indicators/redis.health");
const external_services_health_1 = require("./indicators/external-services.health");
const disk_health_1 = require("./indicators/disk.health");
let HealthController = class HealthController {
    constructor(health, memory, customDisk, database, redis, externalServices) {
        this.health = health;
        this.memory = memory;
        this.customDisk = customDisk;
        this.database = database;
        this.redis = redis;
        this.externalServices = externalServices;
    }
    check() {
        return this.health.check([
            () => this.database.isHealthy('database'),
            () => this.redis.isHealthy('redis'),
        ]);
    }
    detailed() {
        return this.health.check([
            () => this.database.isHealthy('database'),
            () => this.redis.isHealthy('redis'),
            () => this.externalServices.checkWhatsApp('whatsapp'),
            () => this.externalServices.checkOpenAI('openai'),
            () => this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
            () => this.customDisk.checkStorage('storage', {
                path: process.platform === 'win32' ? process.cwd().split('\\')[0] + '\\' : '/',
                thresholdPercent: 0.9
            }),
            () => this.externalServices.checkGoogleCalendar('google_calendar'),
        ]);
    }
    checkDatabase() {
        return this.health.check([
            () => this.database.isHealthy('database'),
        ]);
    }
    checkRedis() {
        return this.health.check([
            () => this.redis.isHealthy('redis'),
        ]);
    }
    checkExternal() {
        return this.health.check([
            () => this.externalServices.checkWhatsApp('whatsapp'),
            () => this.externalServices.checkOpenAI('openai'),
            () => this.externalServices.checkGoogleCalendar('google_calendar'),
        ]);
    }
    checkSystem() {
        return this.health.check([
            () => this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
            () => this.customDisk.checkStorage('storage', {
                path: process.platform === 'win32' ? process.cwd().split('\\')[0] + '\\' : '/',
                thresholdPercent: 0.9
            }),
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('detailed'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "detailed", null);
__decorate([
    (0, common_1.Get)('database'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "checkDatabase", null);
__decorate([
    (0, common_1.Get)('redis'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "checkRedis", null);
__decorate([
    (0, common_1.Get)('external'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "checkExternal", null);
__decorate([
    (0, common_1.Get)('system'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "checkSystem", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.MemoryHealthIndicator,
        disk_health_1.CustomDiskHealthIndicator,
        database_health_1.DatabaseHealthIndicator,
        redis_health_1.RedisHealthIndicator,
        external_services_health_1.ExternalServicesHealthIndicator])
], HealthController);
//# sourceMappingURL=health.controller.js.map