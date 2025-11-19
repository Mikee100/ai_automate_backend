import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { InstagramService } from './instagram.service';

@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get('settings')
  getSettings() {
    return this.instagramService.getSettings();
  }

  @Post('settings')
  updateSettings(@Body() settings: any) {
    return this.instagramService.updateSettings(settings);
  }

  @Post('test-connection')
  testConnection() {
    return this.instagramService.testConnection();
  }

  @Post('send')
  sendMessage(@Body() body: { to: string; message: string }) {
    console.log('📤 Controller: sendMessage called with body:', body);
    return this.instagramService.sendMessage(body.to, body.message);
  }

  @Get('messages')
  getMessages(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('direction') direction?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.instagramService.getMessages({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      direction: direction as 'inbound' | 'outbound',
      customerId,
    });
  }

  @Get('conversations')
  getConversations() {
    return this.instagramService.getConversations();
  }
}
