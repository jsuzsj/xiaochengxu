import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { CreateArticleDto } from './dto/create-article.dto';
import { PublishDto } from './dto/publish.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticlesService } from './articles.service';

interface AdminArticleQuery {
  status?: string;
  search?: string;
  page?: string;
  size?: string;
}

interface AuthedRequest {
  user: { id: string; role: string };
}

@Controller('api/admin/articles')
@UseGuards(AdminGuard)
export class AdminArticlesController {
  constructor(private svc: ArticlesService) {}

  @Get()
  list(@Query() q: AdminArticleQuery) {
    return this.svc.adminList({
      status: q.status !== undefined ? Number(q.status) : undefined,
      search: q.search,
      page: q.page ? Number(q.page) : 1,
      size: q.size ? Number(q.size) : 10,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateArticleDto) {
    return this.svc.create(req.user.id, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/status')
  publish(@Param('id') id: string, @Body() dto: PublishDto) {
    return this.svc.setStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
