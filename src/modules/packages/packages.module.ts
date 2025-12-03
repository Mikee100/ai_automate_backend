import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    providers: [PackagesService, PrismaService],
    exports: [PackagesService],
})
export class PackagesModule { }
