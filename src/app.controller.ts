import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHello() {
        return { message: 'SaaS API is running 🚀' };
    }
}
