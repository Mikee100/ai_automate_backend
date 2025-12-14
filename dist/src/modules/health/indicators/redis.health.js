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
exports.RedisHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
let RedisHealthIndicator = class RedisHealthIndicator extends terminus_1.HealthIndicator {
    constructor(configService) {
        super();
        this.configService = configService;
        this.redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
    }
    async isHealthy(key) {
        let client;
        try {
            client = (0, redis_1.createClient)({ url: this.redisUrl });
            await client.connect();
            const pingResult = await client.ping();
            const info = await client.info('server');
            const memoryInfo = await client.info('memory');
            const testKey = `health-check-${Date.now()}`;
            await client.set(testKey, 'test', { EX: 1 });
            const testValue = await client.get(testKey);
            await client.del(testKey);
            const isHealthy = pingResult === 'PONG' && testValue === 'test';
            const result = this.getStatus(key, isHealthy, {
                message: 'Redis is healthy',
                connected: true,
                ping: pingResult,
                readWriteTest: testValue === 'test',
                timestamp: new Date().toISOString(),
            });
            await client.quit();
            return result;
        }
        catch (error) {
            const isHealthy = false;
            const result = this.getStatus(key, isHealthy, {
                message: 'Redis connection failed',
                error: error.message,
                timestamp: new Date().toISOString(),
            });
            if (client) {
                try {
                    await client.quit();
                }
                catch (e) {
                }
            }
            throw new terminus_1.HealthCheckError('Redis check failed', result);
        }
    }
};
exports.RedisHealthIndicator = RedisHealthIndicator;
exports.RedisHealthIndicator = RedisHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisHealthIndicator);
//# sourceMappingURL=redis.health.js.map