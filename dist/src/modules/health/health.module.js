"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthModule = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const axios_1 = require("@nestjs/axios");
const health_controller_1 = require("./health.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
const database_health_1 = require("./indicators/database.health");
const redis_health_1 = require("./indicators/redis.health");
const external_services_health_1 = require("./indicators/external-services.health");
const disk_health_1 = require("./indicators/disk.health");
let HealthModule = class HealthModule {
};
exports.HealthModule = HealthModule;
exports.HealthModule = HealthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            terminus_1.TerminusModule,
            axios_1.HttpModule,
            prisma_module_1.PrismaModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            database_health_1.DatabaseHealthIndicator,
            redis_health_1.RedisHealthIndicator,
            external_services_health_1.ExternalServicesHealthIndicator,
            disk_health_1.CustomDiskHealthIndicator,
        ],
        exports: [database_health_1.DatabaseHealthIndicator, redis_health_1.RedisHealthIndicator, external_services_health_1.ExternalServicesHealthIndicator, disk_health_1.CustomDiskHealthIndicator],
    })
], HealthModule);
//# sourceMappingURL=health.module.js.map