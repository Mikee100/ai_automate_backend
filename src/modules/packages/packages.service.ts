import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackagesService {
    private readonly logger = new Logger(PackagesService.name);

    constructor(private prisma: PrismaService) { }

    // Fetch all packages (optionally filter by type: 'outdoor' | 'studio')
    async getPackages(type?: string) {
        const where = type ? { type } : {};
        return this.prisma.package.findMany({ where });
    }

    // Fetch a single package by ID
    async getPackageById(id: string) {
        return this.prisma.package.findUnique({ where: { id } });
    }

    // Create a new package
    async createPackage(data: any) {
        return this.prisma.package.create({ data });
    }

    // Update a package
    async updatePackage(id: string, data: any) {
        return this.prisma.package.update({ where: { id }, data });
    }

    // Delete a package
    async deletePackage(id: string) {
        return this.prisma.package.delete({ where: { id } });
    }

    /* --------------------------
     * Helper: Robust package lookup
     * -------------------------- */
    async findPackageByName(name: string) {
        if (!name) return null;
        const cleanName = name.trim();

        // 1. Exact match (insensitive)
        let pkg = await this.prisma.package.findFirst({
            where: {
                name: { equals: cleanName, mode: 'insensitive' }
            }
        });
        if (pkg) return pkg;

        // 2. Try appending " Package" (common AI mismatch)
        const suffixName = `${cleanName} Package`;
        pkg = await this.prisma.package.findFirst({
            where: {
                name: { equals: suffixName, mode: 'insensitive' }
            }
        });
        if (pkg) return pkg;

        // 3. Try contains (insensitive) - fallback
        pkg = await this.prisma.package.findFirst({
            where: {
                name: { contains: cleanName, mode: 'insensitive' }
            }
        });
        return pkg;
    }
}
