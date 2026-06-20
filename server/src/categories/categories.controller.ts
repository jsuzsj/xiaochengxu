import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReaderGuard } from '../auth/reader.guard';
import { CategoriesService } from './categories.service';

@Controller('api/categories')
@UseGuards(ReaderGuard)
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  @Get()
  list() {
    return this.svc.list();
  }
}
