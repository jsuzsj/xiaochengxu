import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @Length(1, 100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  summary?: string;

  @IsString()
  @IsOptional()
  cover_url?: string;

  @IsString()
  content: string;

  @IsUUID()
  category_id: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tag_ids?: string[];

  @IsIn([0, 1])
  @IsOptional()
  status?: number;
}
