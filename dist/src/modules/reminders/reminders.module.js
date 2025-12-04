"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const reminders_service_1 = require("./reminders.service");
const reminders_controller_1 = require("./reminders.controller");
const booking_reminders_listener_1 = require("./listeners/booking-reminders.listener");
const prisma_module_1 = require("../../prisma/prisma.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
let RemindersModule = class RemindersModule {
};
exports.RemindersModule = RemindersModule;
exports.RemindersModule = RemindersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            whatsapp_module_1.WhatsappModule,
            bull_1.BullModule.registerQueue({
                name: 'remindersQueue',
            }),
        ],
        controllers: [reminders_controller_1.RemindersController],
        providers: [reminders_service_1.RemindersService, booking_reminders_listener_1.BookingRemindersListener],
        exports: [reminders_service_1.RemindersService],
    })
], RemindersModule);
//# sourceMappingURL=reminders.module.js.map