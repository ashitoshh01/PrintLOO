import { IsString, IsNumber, IsObject, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString() shopId: string;
  @IsString() fileUrl: string;
  @IsString() fileName: string;
  @IsNumber() @Min(1) pageCount: number;
  @IsObject() config: {
    colorMode: string;
    sides: string;
    copies: number;
    paperSize: string;
  };
}
