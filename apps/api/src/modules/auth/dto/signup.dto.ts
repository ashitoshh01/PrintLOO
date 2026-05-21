import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum SignupRole { CUSTOMER = 'CUSTOMER', OPERATOR = 'OPERATOR' }

export class SignupDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsEnum(SignupRole) role: SignupRole;
  @IsString() @IsOptional() shopName?: string;
  @IsString() @IsOptional() shopLocation?: string;
}
