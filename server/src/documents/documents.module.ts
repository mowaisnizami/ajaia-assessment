import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AccessPolicyService } from './access-policy.service';
import { DocumentShare } from './document-share.entity';
import { Document } from './document.entity';
import { DocumentVersion } from './document-version.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentShare, DocumentVersion]), UsersModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, AccessPolicyService],
})
export class DocumentsModule {}
