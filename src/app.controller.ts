import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHello() {
        return { message: 'Fiesta House APIs is running 🚀' };
    }
}
