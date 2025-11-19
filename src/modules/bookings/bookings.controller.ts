import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.createBooking(
      createBookingDto.customerId,
      createBookingDto.message,
      createBookingDto.service,
      createBookingDto.dateTime ? new Date(createBookingDto.dateTime) : undefined,
    );
  }

  @Get()
  async findAll() {
    return this.bookingsService.getBookings();
  }

  @Get('services')
  getServices() {
    return this.bookingsService.getServices();
  }

  @Get(':customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.bookingsService.getBookings(customerId);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.bookingsService.confirmBooking(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancelBooking(id);
  }
}
