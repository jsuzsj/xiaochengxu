import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListArticleQueryDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  size?: number;
}
