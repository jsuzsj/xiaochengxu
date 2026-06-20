import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReaderGuard } from '../auth/reader.guard';
import { TagsService } from './tags.service';

@Controller('api/tags')
@UseGuards(ReaderGuard)
export class TagsController {
  constructor(private svc: TagsService) {}

  @Get()
  list() {
    return this.svc.list();
  }
}
