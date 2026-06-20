import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { StatsService } from './stats.service';

@Controller('api/admin/stats')
@UseGuards(AdminGuard)
export class StatsController {
  constructor(private svc: StatsService) {}

  @Get()
  get() {
    return this.svc.get();
  }
}
