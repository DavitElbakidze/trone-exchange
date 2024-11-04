import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  IsOptional,
} from 'class-validator';
import { RoleEnum } from '../enum/role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}
