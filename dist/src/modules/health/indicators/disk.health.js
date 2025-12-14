"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomDiskHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const checkDiskSpace = require('check-disk-space').default || require('check-disk-space');
let CustomDiskHealthIndicator = class CustomDiskHealthIndicator extends terminus_1.HealthIndicator {
    async checkStorage(key, options) {
        try {
            const diskSpace = await checkDiskSpace(options.path);
            const used = diskSpace.size - diskSpace.free;
            const usedPercent = (used / diskSpace.size) * 100;
            const isHealthy = usedPercent < (options.thresholdPercent * 100);
            return this.getStatus(key, true, {
                message: isHealthy
                    ? 'Disk storage is healthy'
                    : 'Disk usage exceeds threshold (non-critical)',
                status: isHealthy ? 'healthy' : 'warning',
                free: Math.round(diskSpace.free / 1024 / 1024 / 1024 * 100) / 100,
                size: Math.round(diskSpace.size / 1024 / 1024 / 1024 * 100) / 100,
                used: Math.round(used / 1024 / 1024 / 1024 * 100) / 100,
                usedPercent: Math.round(usedPercent * 100) / 100,
                threshold: `${(options.thresholdPercent * 100).toFixed(0)}%`,
                path: options.path,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            return this.getStatus(key, true, {
                message: 'Disk storage check completed (non-critical)',
                status: 'warning',
                error: error.message || 'Unable to check disk space',
                path: options.path,
                timestamp: new Date().toISOString(),
            });
        }
    }
};
exports.CustomDiskHealthIndicator = CustomDiskHealthIndicator;
exports.CustomDiskHealthIndicator = CustomDiskHealthIndicator = __decorate([
    (0, common_1.Injectable)()
], CustomDiskHealthIndicator);
//# sourceMappingURL=disk.health.js.map