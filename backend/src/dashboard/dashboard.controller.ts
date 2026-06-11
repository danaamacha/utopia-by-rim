// backend/src/dashboard/dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

// @UseGuards(AdminGuard) — uncomment when ready

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/admin/dashboard
   * Returns today's stats + recent orders
   */
  @Get()
  getStats() {
    return this.dashboardService.getStats();
  }
}