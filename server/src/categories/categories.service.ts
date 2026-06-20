import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
  ) {}

  list() {
    return this.repo.find({ order: { sort: 'ASC', created_at: 'ASC' } });
  }

  create(dto: CreateCategoryDto) {
    return this.repo.save(this.repo.create({ name: dto.name, sort: dto.sort ?? 0 }));
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('分类不存在');
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: string): Promise<void> {
    const count = await this.articleRepo
      .createQueryBuilder('a')
      .where('a.category_id = :id', { id })
      .getCount();
    if (count > 0) throw new ConflictException('分类下存在文章，无法删除');
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException('分类不存在');
  }
}
