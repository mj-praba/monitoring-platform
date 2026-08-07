import { IsEmail, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class TestValidationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(18)
  age: number;
}
