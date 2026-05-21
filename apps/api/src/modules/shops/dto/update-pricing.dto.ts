import { IsArray, ValidateNested, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PricingRuleDto {
  @IsString() colorMode: string;
  @IsString() sides: string;
  @IsNumber() pricePerPage: number;
}

export class UpdatePricingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingRuleDto)
  rules: PricingRuleDto[];
}
