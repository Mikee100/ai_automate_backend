import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: {
        messages: true,
        bookings: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        messages: true,
        bookings: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.customer.findUnique({
      where: { email },
    });
  }

  async findByWhatsappId(whatsappId: string) {
    return this.prisma.customer.findUnique({
      where: { whatsappId },
    });
  }

  async findByInstagramId(instagramId: string) {
    return this.prisma.customer.findUnique({
      where: { instagramId },
    });
  }

  async update(id: string, updateCustomerDto: Partial<CreateCustomerDto>) {
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
