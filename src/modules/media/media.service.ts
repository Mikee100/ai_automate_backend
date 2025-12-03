import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.mediaAsset.findMany({
      distinct: ['category'],
      select: { category: true },
    });
    return categories.map(c => c.category);
  }

  async getByCategory(category: string, limit = 20) {
    return this.prisma.mediaAsset.findMany({
      where: { category },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBackdrops(limit = 20) {
    return this.prisma.mediaAsset.findMany({
      where: { category: 'backdrop' },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
