import { IsString, IsNumber, IsEnum } from 'class-validator';

export class CalculatePriceDto {
  @IsString() shopId: string;
  @IsNumber() pageCount: number;
  @IsNumber() copies: number;
  @IsEnum(['bw', 'color']) colorMode: string;
  @IsEnum(['single', 'duplex']) sides: string;
}
