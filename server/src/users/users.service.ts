import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

interface ListQuery {
  search?: string;
  page: number;
  size: number;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async list(q: ListQuery) {
    const qb = this.repo.createQueryBuilder('u');
    if (q.search) qb.andWhere('u.nickname ILIKE :s', { s: `%${q.search}%` });
    qb.orderBy('u.created_at', 'DESC')
      .skip((q.page - 1) * q.size)
      .take(q.size);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: q.page, size: q.size };
  }

  detail(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
