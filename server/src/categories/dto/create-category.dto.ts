import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 20)
  name: string;

  @IsInt()
  @IsOptional()
  sort?: number;
}
