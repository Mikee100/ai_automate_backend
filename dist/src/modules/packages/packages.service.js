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
var PackagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PackagesService = PackagesService_1 = class PackagesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PackagesService_1.name);
    }
    async getPackages(type) {
        const where = type ? { type } : {};
        return this.prisma.package.findMany({ where });
    }
    async getPackageById(id) {
        return this.prisma.package.findUnique({ where: { id } });
    }
    async createPackage(data) {
        return this.prisma.package.create({ data });
    }
    async updatePackage(id, data) {
        return this.prisma.package.update({ where: { id }, data });
    }
    async deletePackage(id) {
        return this.prisma.package.delete({ where: { id } });
    }
    async findPackageByName(name) {
        if (!name)
            return null;
        const cleanName = name.trim();
        let pkg = await this.prisma.package.findFirst({
            where: {
                name: { equals: cleanName, mode: 'insensitive' }
            }
        });
        if (pkg)
            return pkg;
        const suffixName = `${cleanName} Package`;
        pkg = await this.prisma.package.findFirst({
            where: {
                name: { equals: suffixName, mode: 'insensitive' }
            }
        });
        if (pkg)
            return pkg;
        pkg = await this.prisma.package.findFirst({
            where: {
                name: { contains: cleanName, mode: 'insensitive' }
            }
        });
        return pkg;
    }
};
exports.PackagesService = PackagesService;
exports.PackagesService = PackagesService = PackagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PackagesService);
//# sourceMappingURL=packages.service.js.map