import { IsEnum } from 'class-validator';

export enum OrderStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  PRINTING = 'PRINTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
