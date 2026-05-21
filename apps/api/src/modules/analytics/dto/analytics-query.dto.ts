import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum DateRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @IsEnum(DateRange)
  @IsOptional()
  range: DateRange = DateRange.TODAY;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
