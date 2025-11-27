import { Controller, Get, Post, Param } from '@nestjs/common';
import { EscalationService } from './escalation.service';

@Controller('escalations')
export class EscalationController {
    constructor(private readonly escalationService: EscalationService) { }

    @Get()
    async getOpenEscalations() {
        return this.escalationService.getOpenEscalations();
    }

    @Post(':id/resolve')
    async resolveEscalation(@Param('id') id: string) {
        return this.escalationService.resolveEscalation(id);
    }
}
