import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { ReadRecord } from '../entities/read-record.entity';
import { User } from '../entities/user.entity';

interface TrendPoint {
  date: string;
  count: number;
}
interface Bucket {
  today: number;
  d7: number;
  d30: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ReadRecord) private readRepo: Repository<ReadRecord>,
  ) {}

  async get() {
    // 卡片
    const readerTotal = await this.userRepo.count();
    const articleTotal = await this.articleRepo.count();
    const articlePublished = await this.articleRepo.count({ where: { status: 1 } });
    const viewTotal = await this.readRepo.count();

    const readerNew: Bucket = await this.countBuckets(this.userRepo);
    const view: Bucket = await this.countBuckets(this.readRepo);
    const active: Bucket = await this.activeBuckets();

    // 折线（近 30 天按天）
    const readerTrend = await this.dailyCount(this.userRepo);
    const viewTrend = await this.dailyReadCount(false);
    const activeTrend = await this.dailyReadCount(true);

    // 饼图
    const categoryDistRaw = await this.readRepo
      .createQueryBuilder('r')
      .leftJoin('articles', 'a', 'a.id = r.article_id')
      .leftJoin('categories', 'c', 'c.id = a.category_id')
      .select('c.name', 'name')
      .addSelect('count(*)', 'count')
      .groupBy('c.name')
      .getRawMany();
    const tagDistRaw = await this.readRepo
      .createQueryBuilder('r')
      .leftJoin('article_tags', 'at', 'at.article_id = r.article_id')
      .leftJoin('tags', 't', 't.id = at.tag_id')
      .select('t.name', 'name')
      .addSelect('count(*)', 'count')
      .where('t.name IS NOT NULL')
      .groupBy('t.name')
      .getRawMany();

    // 热门 Top 10
    const topRaw = await this.readRepo
      .createQueryBuilder('r')
      .select('r.article_id', 'id')
      .addSelect('count(*)', 'reads')
      .groupBy('r.article_id')
      .orderBy('reads', 'DESC')
      .limit(10)
      .getRawMany();
    const topArticles = await Promise.all(
      (topRaw as { id: string; reads: string }[]).map(async (x) => {
        const a = await this.articleRepo.findOne({ where: { id: x.id } });
        return { id: x.id, title: a?.title ?? '', view_count: a?.view_count ?? 0 };
      }),
    );

    return {
      readerTotal,
      readerNew,
      active,
      viewTotal,
      view,
      articleTotal,
      articlePublished,
      readerTrend,
      activeTrend,
      viewTrend,
      categoryDist: (categoryDistRaw as { name: string | null; count: string }[])
        .filter((x) => x.name)
        .map((x) => ({ name: x.name as string, count: Number(x.count) })),
      tagDist: (tagDistRaw as { name: string; count: string }[]).map((x) => ({
        name: x.name,
        count: Number(x.count),
      })),
      topArticles,
    };
  }

  private async countBuckets(repo: Repository<unknown>): Promise<Bucket> {
    const today = await repo.createQueryBuilder('e').where('e.created_at >= current_date').getCount();
    const d7 = await repo
      .createQueryBuilder('e')
      .where("e.created_at >= now() - interval '7 days'")
      .getCount();
    const d30 = await repo
      .createQueryBuilder('e')
      .where("e.created_at >= now() - interval '30 days'")
      .getCount();
    return { today, d7, d30 };
  }

  private async activeBuckets(): Promise<Bucket> {
    const distinct = (where: string) =>
      this.readRepo.createQueryBuilder('r').select('DISTINCT r.user_id', 'uid').where(where).getRawMany();
    const today = (await distinct('r.created_at >= current_date')).length;
    const d7 = (await distinct("r.created_at >= now() - interval '7 days'")).length;
    const d30 = (await distinct("r.created_at >= now() - interval '30 days'")).length;
    return { today, d7, d30 };
  }

  private async dailyCount(repo: Repository<unknown>): Promise<TrendPoint[]> {
    const rows = await repo
      .createQueryBuilder('e')
      .select("to_char(date_trunc('day', e.created_at), 'YYYY-MM-DD')", 'd')
      .addSelect('count(*)', 'c')
      .where("e.created_at >= now() - interval '30 days'")
      .groupBy('d')
      .orderBy('d', 'ASC')
      .getRawMany();
    return (rows as { d: string; c: string }[]).map((r) => ({ date: r.d, count: Number(r.c) }));
  }

  private async dailyReadCount(distinctUser: boolean): Promise<TrendPoint[]> {
    const agg = distinctUser ? 'count(DISTINCT r.user_id)' : 'count(*)';
    const rows = await this.readRepo
      .createQueryBuilder('r')
      .select("to_char(date_trunc('day', r.created_at), 'YYYY-MM-DD')", 'd')
      .addSelect(agg, 'c')
      .where("r.created_at >= now() - interval '30 days'")
      .groupBy('d')
      .orderBy('d', 'ASC')
      .getRawMany();
    return (rows as { d: string; c: string }[]).map((r) => ({ date: r.d, count: Number(r.c) }));
  }
}
