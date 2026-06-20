import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from './admin.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ name: 'cover_url', nullable: true, type: 'varchar' })
  cover_url: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'smallint', default: 0 })
  status: number; // 0 草稿 / 1 已发布

  @Column({ name: 'view_count', type: 'int', default: 0 })
  view_count: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  published_at: Date | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'author_admin_id' })
  author: Admin | null;

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'article_tags' })
  tags: Tag[];
}
