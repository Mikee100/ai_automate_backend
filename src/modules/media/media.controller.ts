import { Controller, Get, Param, Query } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('categories')
  async getCategories() {
    return this.mediaService.getCategories();
  }

  @Get('by-category/:category')
  async getByCategory(@Param('category') category: string, @Query('limit') limit?: string) {
    return this.mediaService.getByCategory(category, Number(limit) || 20);
  }

  @Get('backdrops')
  async getBackdrops(@Query('limit') limit?: string) {
    return this.mediaService.getBackdrops(Number(limit) || 20);
  }

  @Get('portfolio')
  async getPortfolio(@Query('limit') limit?: string) {
    return this.mediaService.getByCategory('portfolio', Number(limit) || 20);
  }
}
