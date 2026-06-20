import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { UsersService } from './users.service';

interface UserQuery {
  search?: string;
  page?: string;
  size?: string;
}

@Controller('api/admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private svc: UsersService) {}

  @Get()
  list(@Query() q: UserQuery) {
    return this.svc.list({
      search: q.search,
      page: q.page ? Number(q.page) : 1,
      size: q.size ? Number(q.size) : 10,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.svc.detail(id);
  }
}
