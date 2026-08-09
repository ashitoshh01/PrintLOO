import { IsString, IsOptional, IsObject, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateShopDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() contact?: string;
  @IsNumber() @IsOptional() @Type(() => Number) latitude?: number;
  @IsNumber() @IsOptional() @Type(() => Number) longitude?: number;
  @IsObject() @IsOptional() settings?: {
    operatingHours?: { open: string; close: string; days: string[] };
    queueCapacity?: number;
    autoAcceptOrders?: boolean;
  };
}
