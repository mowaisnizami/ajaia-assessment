import { IsEmail, IsEnum } from 'class-validator';
import { SharePermission } from '../document-share.entity';

export class ShareDocumentDto {
  @IsEmail()
  email!: string;

  @IsEnum(SharePermission)
  permission!: SharePermission;
}
