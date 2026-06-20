import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  openid: string;

  @Column({ nullable: true, type: 'varchar' })
  unionid: string | null;

  @Column({ nullable: true, type: 'varchar' })
  nickname: string | null;

  @Column({ name: 'avatar_url', nullable: true, type: 'varchar' })
  avatar_url: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  last_login_at: Date | null;
}
