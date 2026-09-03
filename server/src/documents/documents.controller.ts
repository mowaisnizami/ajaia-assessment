import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@Headers('x-user-id') userId: string) {
    return this.documents.list(userId);
  }

  @Post()
  create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documents.create(userId, dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 1_048_576 } }))
  import(
    @Headers('x-user-id') userId: string,
    @UploadedFile() file?: { originalname: string; size: number; buffer: Buffer },
  ) {
    return this.documents.import(userId, file);
  }

  @Get(':id')
  get(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.documents.get(userId, id);
  }

  @Get(':id/versions')
  versions(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.documents.listVersions(userId, id);
  }

  @Get(':id/presence')
  presence(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.documents.listPresence(userId, id);
  }

  @Post(':id/presence')
  heartbeat(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.documents.heartbeatPresence(userId, id);
  }

  @Patch(':id')
  update(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documents.update(userId, id, dto);
  }

  @Post(':id/shares')
  share(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() dto: ShareDocumentDto,
  ) {
    return this.documents.share(userId, id, dto);
  }
}
