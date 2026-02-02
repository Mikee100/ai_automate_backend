import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Get('external/:externalId')
  findByExternalId(@Param('externalId') externalId: string) {
    return this.messagesService.findByExternalId(externalId);
  }

  @Get(':customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.messagesService.findByCustomer(customerId);
  }
}
