import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { extname, parse } from 'node:path';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { AccessPolicyService } from './access-policy.service';
import { DocumentShare, SharePermission } from './document-share.entity';
import { Document } from './document.entity';
import { DocumentVersion } from './document-version.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

type UploadedTextFile = {
  originalname: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documents: Repository<Document>,
    @InjectRepository(DocumentShare)
    private readonly shares: Repository<DocumentShare>,
    @InjectRepository(DocumentVersion)
    private readonly versions: Repository<DocumentVersion>,
    private readonly users: UsersService,
    private readonly policy: AccessPolicyService,
  ) {}

  private readonly presence = new Map<string, number>();

  async list(userId: string) {
    await this.users.requireUser(userId);

    const [owned, sharedRecords] = await Promise.all([
      this.documents.find({
        where: { ownerId: userId },
        order: { updatedAt: 'DESC' },
      }),
      this.shares.find({
        where: { userId },
        relations: { document: { owner: true } },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      owned: owned.map((document) => ({ ...document, access: 'OWNER' })),
      shared: sharedRecords.map((share) => ({
        ...share.document,
        access: share.permission,
      })),
    };
  }

  async create(userId: string, dto: CreateDocumentDto) {
    await this.users.requireUser(userId);
    const document = await this.documents.save(
      this.documents.create({
        title: dto.title?.trim() || 'Untitled document',
        ownerId: userId,
        content: '<p><br></p>',
      }),
    );
    await this.recordVersion(document, userId);
    return document;
  }

  async get(userId: string, documentId: string) {
    const access = await this.resolveAccess(userId, documentId);
    return { ...access.document, access: access.role };
  }

  async update(userId: string, documentId: string, dto: UpdateDocumentDto) {
    const access = await this.resolveAccess(userId, documentId);
    if (!this.policy.canEdit(access.isOwner, access.permission)) {
      throw new ForbiddenException('Viewer access does not permit editing');
    }

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) throw new BadRequestException('Title cannot be empty');
      access.document.title = title;
    }
    if (dto.content !== undefined) access.document.content = dto.content;

    const saved = await this.documents.save(access.document);
    await this.recordVersion(saved, userId);
    return { ...saved, access: access.role };
  }

  async import(userId: string, file?: UploadedTextFile) {
    await this.users.requireUser(userId);
    if (!file) throw new BadRequestException('Choose a file to import');

    const extension = extname(file.originalname).toLowerCase();
    if (!['.txt', '.md'].includes(extension)) {
      throw new BadRequestException('Only .txt and .md files are supported');
    }
    if (file.size > 1_048_576) {
      throw new BadRequestException('Files must be 1 MB or smaller');
    }

    const text = file.buffer.toString('utf8').trim();
    if (!text) throw new BadRequestException('The selected file is empty');

    const document = await this.documents.save(
      this.documents.create({
        ownerId: userId,
        title: parse(file.originalname).name.slice(0, 200),
        content: this.textToHtml(text),
      }),
    );
    await this.recordVersion(document, userId);
    return document;
  }

  async share(userId: string, documentId: string, dto: ShareDocumentDto) {
    const access = await this.resolveAccess(userId, documentId);
    if (!this.policy.canShare(access.isOwner)) {
      throw new ForbiddenException('Only the owner can share this document');
    }

    const recipient = await this.users.findByEmail(dto.email);
    if (recipient.id === userId) {
      throw new BadRequestException('The owner already has full access');
    }

    await this.shares.upsert(
      {
        documentId,
        userId: recipient.id,
        permission: dto.permission,
      },
      ['documentId', 'userId'],
    );

    return { recipient, permission: dto.permission };
  }

  async listVersions(userId: string, documentId: string) {
    await this.resolveAccess(userId, documentId);
    const versions = await this.versions.find({
      where: { documentId },
      relations: { editedBy: true },
      order: { version: 'DESC' },
      take: 20,
    });
    return versions.map(({ id, version, title, editedBy, createdAt }) => ({
      id,
      version,
      title,
      editedBy: { id: editedBy.id, name: editedBy.name, email: editedBy.email },
      createdAt,
    }));
  }

  async heartbeatPresence(userId: string, documentId: string) {
    await this.resolveAccess(userId, documentId);
    this.presence.set(this.presenceKey(documentId, userId), Date.now());
    return this.listPresence(userId, documentId);
  }

  async listPresence(userId: string, documentId: string) {
    const access = await this.resolveAccess(userId, documentId);
    const shares = await this.shares.find({
      where: { documentId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
    const people = [
      { user: access.document.owner, role: 'OWNER' },
      ...shares.map((share) => ({ user: share.user, role: share.permission })),
    ];
    const threshold = Date.now() - 45_000;
    return people.map(({ user, role }) => {
      const lastSeen = this.presence.get(this.presenceKey(documentId, user.id));
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        online: Boolean(lastSeen && lastSeen >= threshold),
        lastSeenAt: lastSeen ? new Date(lastSeen).toISOString() : null,
      };
    });
  }

  private async resolveAccess(userId: string, documentId: string) {
    await this.users.requireUser(userId);
    const document = await this.documents.findOne({
      where: { id: documentId },
      relations: { owner: true },
    });
    if (!document) throw new NotFoundException('Document not found');

    const isOwner = document.ownerId === userId;
    if (isOwner) {
      return { document, isOwner, role: 'OWNER' as const };
    }

    const share = await this.shares.findOneBy({ documentId, userId });
    if (!share) throw new ForbiddenException('This document is not shared with you');

    return {
      document,
      isOwner,
      permission: share.permission,
      role: share.permission,
    };
  }

  private async recordVersion(document: Document, editedById: string) {
    const version = (await this.versions.count({ where: { documentId: document.id } })) + 1;
    await this.versions.save(
      this.versions.create({
        documentId: document.id,
        version,
        title: document.title,
        content: document.content,
        editedById,
      }),
    );
  }

  private presenceKey(documentId: string, userId: string) {
    return `${documentId}:${userId}`;
  }

  private textToHtml(text: string) {
    const escaped = text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

    return escaped
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replaceAll('\n', '<br>')}</p>`)
      .join('');
  }
}
