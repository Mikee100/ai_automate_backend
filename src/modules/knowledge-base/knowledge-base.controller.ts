import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';

@Controller('knowledge-base')
export class KnowledgeBaseController {
    constructor(private readonly knowledgeBaseService: KnowledgeBaseService) { }

    @Post()
    create(@Body() createDto: { question: string; answer: string; category: string }) {
        return this.knowledgeBaseService.create(createDto);
    }

    @Get()
    findAll(@Query('category') category?: string, @Query('search') search?: string) {
        return this.knowledgeBaseService.findAll({ category, search });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.knowledgeBaseService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: Partial<{ question: string; answer: string; category: string }>) {
        return this.knowledgeBaseService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.knowledgeBaseService.remove(id);
    }
}
