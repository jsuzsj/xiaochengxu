import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReaderGuard } from '../auth/reader.guard';
import { ListArticleQueryDto } from './dto/list-article-query.dto';
import { ArticlesService } from './articles.service';

@Controller('api/articles')
@UseGuards(ReaderGuard)
export class ArticlesController {
  constructor(private svc: ArticlesService) {}

  @Get()
  list(@Query() q: ListArticleQueryDto) {
    return this.svc.listPublished({
      category: q.category,
      tag: q.tag,
      page: q.page ?? 1,
      size: q.size ?? 10,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const a = await this.svc.getPublished(id);
    await this.svc.incrView(id);
    a.view_count += 1;
    return a;
  }
}
