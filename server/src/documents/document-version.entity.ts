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

@Entity('document_versions')
@Unique(['documentId', 'version'])
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'document_id' })
  documentId!: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document!: Document;

  @Column('int')
  version!: number;

  @Column({ length: 200 })
  title!: string;

  @Column('text')
  content!: string;

  @Column('uuid', { name: 'edited_by_id' })
  editedById!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'edited_by_id' })
  editedBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
