import { IsIn } from 'class-validator';

export class PublishDto {
  @IsIn([0, 1])
  status: number;
}
