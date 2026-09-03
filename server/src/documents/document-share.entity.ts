import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Document } from './document.entity';

export enum SharePermission {
  Viewer = 'VIEWER',
  Editor = 'EDITOR',
}

@Entity('document_shares')
@Unique(['documentId', 'userId'])
export class DocumentShare {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'document_id' })
  documentId!: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document!: Document;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: SharePermission })
  permission!: SharePermission;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
