import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @Length(1, 20)
  name?: string;
}
