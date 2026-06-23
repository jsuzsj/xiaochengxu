import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { ReadRecord } from '../entities/read-record.entity';
import { User } from '../entities/user.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User, ReadRecord])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
