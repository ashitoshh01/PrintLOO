import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATOR', 'ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getDailySummary(@CurrentUser() user: any) {
    return this.analyticsService.getDailySummary(user.shopId, new Date());
  }

  @Get('revenue')
  async getRevenueTimeline(@Query() query: AnalyticsQueryDto, @CurrentUser() user: any) {
    const { from, to } = this.analyticsService.getDateRange(query.range, query.from, query.to);
    return this.analyticsService.getRevenueTimeline(user.shopId, from, to);
  }

  @Get('print-types')
  async getOrdersByPrintType(@Query() query: AnalyticsQueryDto, @CurrentUser() user: any) {
    const { from, to } = this.analyticsService.getDateRange(query.range, query.from, query.to);
    return this.analyticsService.getOrdersByPrintType(user.shopId, from, to);
  }

  @Get('peak-hours')
  async getPeakHours(@Query() query: AnalyticsQueryDto, @CurrentUser() user: any) {
    const { from, to } = this.analyticsService.getDateRange(query.range, query.from, query.to);
    return this.analyticsService.getPeakHours(user.shopId, from, to);
  }

  @Get('turnaround')
  async getTokenTurnaround(@Query() query: AnalyticsQueryDto, @CurrentUser() user: any) {
    const { from, to } = this.analyticsService.getDateRange(query.range, query.from, query.to);
    return this.analyticsService.getTokenTurnaround(user.shopId, from, to);
  }

  @Get('stats')
  async getTopStats(@Query() query: AnalyticsQueryDto, @CurrentUser() user: any) {
    const { from, to } = this.analyticsService.getDateRange(query.range, query.from, query.to);
    return this.analyticsService.getTopStats(user.shopId, from, to);
  }
}
