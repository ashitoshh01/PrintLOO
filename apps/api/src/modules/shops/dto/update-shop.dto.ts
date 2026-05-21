import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class UpdateShopDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() contact?: string;
  @IsObject() @IsOptional() settings?: {
    operatingHours?: { open: string; close: string; days: string[] };
    queueCapacity?: number;
    autoAcceptOrders?: boolean;
  };
}
