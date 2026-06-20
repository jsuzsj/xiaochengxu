import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

function pgCode(e: unknown): string | undefined {
  if (e instanceof QueryFailedError) {
    const driver = (e as { driverError?: { code?: string } }).driverError;
    return driver?.code ?? (e as { code?: string }).code;
  }
  return undefined;
}

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private repo: Repository<Tag>,
    @InjectDataSource() private ds: DataSource,
  ) {}

  list() {
    return this.repo.find({ order: { created_at: 'ASC' } });
  }

  async create(dto: CreateTagDto) {
    try {
      return await this.repo.save(this.repo.create({ name: dto.name }));
    } catch (e) {
      if (pgCode(e) === '23505') throw new ConflictException('标签已存在');
      throw e;
    }
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.repo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('标签不存在');
    Object.assign(tag, dto);
    try {
      return await this.repo.save(tag);
    } catch (e) {
      if (pgCode(e) === '23505') throw new ConflictException('标签已存在');
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    await this.ds.query('DELETE FROM article_tags WHERE tag_id = $1', [id]);
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException('标签不存在');
  }
}
