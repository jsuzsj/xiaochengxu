import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async get() {
    const articleTotal = await this.articleRepo.count();
    const articlePublished = await this.articleRepo.count({ where: { status: 1 } });
    const readerTotal = await this.userRepo.count();
    const raw = await this.articleRepo
      .createQueryBuilder()
      .select('COALESCE(SUM(view_count), 0)', 'v')
      .getRawOne<{ v: string }>();
    return {
      articleTotal,
      articlePublished,
      readerTotal,
      viewTotal: Number(raw?.v ?? 0),
    };
  }
}
