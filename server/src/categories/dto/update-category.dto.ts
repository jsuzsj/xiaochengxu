import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @Length(1, 20)
  name?: string;

  @IsInt()
  @IsOptional()
  sort?: number;
}
