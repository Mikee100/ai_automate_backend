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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersController = void 0;
const common_1 = require("@nestjs/common");
const reminders_service_1 = require("./reminders.service");
const reminder_dto_1 = require("./dto/reminder.dto");
let RemindersController = class RemindersController {
    constructor(remindersService) {
        this.remindersService = remindersService;
    }
    async getReminders(filters) {
        return this.remindersService.getReminders(filters);
    }
    async getBookingReminders(bookingId) {
        return this.remindersService.getReminders({ bookingId });
    }
    async getUpcomingReminders(limit) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.remindersService.getUpcomingReminders(limitNum);
    }
    async getReminder(id) {
        return this.remindersService.getReminderById(id);
    }
    async sendReminder(id) {
        return this.remindersService.sendReminder(id);
    }
    async updateReminder(id, data) {
        return this.remindersService.updateReminder(id, data);
    }
    async cancelReminder(id) {
        return this.remindersService.updateReminder(id, { status: 'cancelled' });
    }
};
exports.RemindersController = RemindersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reminder_dto_1.ReminderFilterDto]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "getReminders", null);
__decorate([
    (0, common_1.Get)('booking/:bookingId'),
    __param(0, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "getBookingReminders", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "getUpcomingReminders", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "getReminder", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "sendReminder", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reminder_dto_1.UpdateReminderDto]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "updateReminder", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RemindersController.prototype, "cancelReminder", null);
exports.RemindersController = RemindersController = __decorate([
    (0, common_1.Controller)('reminders'),
    __metadata("design:paramtypes", [reminders_service_1.RemindersService])
], RemindersController);
//# sourceMappingURL=reminders.controller.js.map