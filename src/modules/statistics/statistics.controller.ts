import { Controller, Get } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('active-users')
  getActiveUsers() {
    return this.statisticsService.getActiveUsers();
  }

  @Get('engaged-customers')
  getEngagedCustomers() {
    return this.statisticsService.getEngagedCustomers();
  }

  @Get('package-popularity')
  getPackagePopularity() {
    return this.statisticsService.getPackagePopularity();
  }
}
