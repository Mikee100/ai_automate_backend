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
exports.ExternalServicesHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const rxjs_2 = require("rxjs");
let ExternalServicesHealthIndicator = class ExternalServicesHealthIndicator extends terminus_1.HealthIndicator {
    constructor(httpService, configService) {
        super();
        this.httpService = httpService;
        this.configService = configService;
    }
    async checkWhatsApp(key) {
        try {
            const phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
            const accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
            const apiVersion = this.configService.get('WHATSAPP_API_VERSION', 'v21.0');
            if (!phoneNumberId || !accessToken) {
                return this.getStatus(key, false, {
                    message: 'WhatsApp credentials not configured',
                    configured: false,
                    timestamp: new Date().toISOString(),
                });
            }
            const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                params: { access_token: accessToken },
                timeout: 5000,
            }).pipe((0, operators_1.timeout)(5000), (0, operators_1.catchError)(() => (0, rxjs_2.of)({ status: 500, data: null }))));
            const isHealthy = response.status === 200;
            return this.getStatus(key, isHealthy, {
                message: isHealthy ? 'WhatsApp API is accessible' : 'WhatsApp API check failed',
                configured: true,
                status: response.status,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            return this.getStatus(key, false, {
                message: 'WhatsApp API check failed',
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    }
    async checkOpenAI(key) {
        try {
            const apiKey = this.configService.get('OPENAI_API_KEY');
            if (!apiKey) {
                return this.getStatus(key, false, {
                    message: 'OpenAI API key not configured',
                    configured: false,
                    timestamp: new Date().toISOString(),
                });
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${apiKey}` },
                timeout: 5000,
            }).pipe((0, operators_1.timeout)(5000), (0, operators_1.catchError)(() => (0, rxjs_2.of)({ status: 500, data: null }))));
            const isHealthy = response.status === 200;
            return this.getStatus(key, isHealthy, {
                message: isHealthy ? 'OpenAI API is accessible' : 'OpenAI API check failed',
                configured: true,
                status: response.status,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            return this.getStatus(key, false, {
                message: 'OpenAI API check failed',
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    }
    async checkGoogleCalendar(key) {
        try {
            const googleClientId = this.configService.get('GOOGLE_CLIENT_ID');
            const googleClientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
            if (!googleClientId || !googleClientSecret) {
                return this.getStatus(key, true, {
                    message: 'Google Calendar credentials not configured (optional)',
                    configured: false,
                    optional: true,
                    timestamp: new Date().toISOString(),
                });
            }
            return this.getStatus(key, true, {
                message: 'Google Calendar credentials configured',
                configured: true,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            return this.getStatus(key, true, {
                message: 'Google Calendar check failed (optional service)',
                error: error.message,
                optional: true,
                timestamp: new Date().toISOString(),
            });
        }
    }
};
exports.ExternalServicesHealthIndicator = ExternalServicesHealthIndicator;
exports.ExternalServicesHealthIndicator = ExternalServicesHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], ExternalServicesHealthIndicator);
//# sourceMappingURL=external-services.health.js.map