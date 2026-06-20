import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { sanitize } from './sanitize';

interface ListPublishedQuery {
  category?: string;
  tag?: string;
  page: number;
  size: number;
}

interface AdminListQuery {
  status?: number;
  search?: string;
  page: number;
  size: number;
}

function toListVm(a: Article) {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    cover_url: a.cover_url,
    category: a.category ? { id: a.category.id, name: a.category.name } : null,
    tags: (a.tags ?? []).map((t) => ({ id: t.id, name: t.name })),
    published_at: a.published_at,
    view_count: a.view_count,
  };
}

@Injectable()
export class ArticlesService {
  constructor(@InjectRepository(Article) private repo: Repository<Article>) {}

  async listPublished(q: ListPublishedQuery) {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.category', 'c')
      .leftJoinAndSelect('a.tags', 't')
      .where('a.status = 1')
      .orderBy('a.published_at', 'DESC')
      .addOrderBy('a.created_at', 'DESC')
      .skip((q.page - 1) * q.size)
      .take(q.size);
    if (q.category) qb.andWhere('a.category_id = :c', { c: q.category });
    if (q.tag) qb.andWhere('t.id = :t', { t: q.tag });
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(toListVm), total, page: q.page, size: q.size };
  }

  async getPublished(id: string): Promise<Article> {
    const a = await this.repo.findOne({
      where: { id },
      relations: { category: true, tags: true },
    });
    if (!a || a.status !== 1) throw new NotFoundException();
    return a;
  }

  incrView(id: string) {
    return this.repo.increment({ id }, 'view_count', 1);
  }

  async adminList(q: AdminListQuery) {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.category', 'c')
      .leftJoinAndSelect('a.tags', 't');
    if (q.status !== undefined) qb.andWhere('a.status = :s', { s: q.status });
    if (q.search) qb.andWhere('a.title ILIKE :t', { t: `%${q.search}%` });
    qb.orderBy('a.created_at', 'DESC')
      .skip((q.page - 1) * q.size)
      .take(q.size);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: q.page, size: q.size };
  }

  async create(adminId: string, dto: CreateArticleDto) {
    const a = this.repo.create({
      title: dto.title,
      summary: dto.summary ?? null,
      cover_url: dto.cover_url ?? null,
      content: sanitize(dto.content),
      category: dto.category_id ? ({ id: dto.category_id } as Category) : null,
      tags: (dto.tag_ids ?? []).map((id) => ({ id } as Tag)),
      author: { id: adminId } as Admin,
      status: dto.status ?? 0,
      published_at: dto.status === 1 ? new Date() : null,
    });
    return this.repo.save(a);
  }

  async update(id: string, dto: UpdateArticleDto) {
    const a = await this.repo.findOne({ where: { id }, relations: { tags: true } });
    if (!a) throw new NotFoundException();
    if (dto.title !== undefined) a.title = dto.title;
    if (dto.summary !== undefined) a.summary = dto.summary;
    if (dto.cover_url !== undefined) a.cover_url = dto.cover_url;
    if (dto.content !== undefined) a.content = sanitize(dto.content);
    if (dto.category_id !== undefined)
      a.category = dto.category_id ? ({ id: dto.category_id } as Category) : null;
    if (dto.tag_ids !== undefined) a.tags = dto.tag_ids.map((tid) => ({ id: tid } as Tag));
    if (dto.status !== undefined) {
      a.status = dto.status;
      if (dto.status === 1 && !a.published_at) a.published_at = new Date();
    }
    return this.repo.save(a);
  }

  async setStatus(id: string, status: number) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException();
    a.status = status;
    if (status === 1 && !a.published_at) a.published_at = new Date();
    return this.repo.save(a);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException();
  }
}
