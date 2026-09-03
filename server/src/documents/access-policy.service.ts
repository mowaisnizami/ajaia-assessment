import { Injectable } from '@nestjs/common';
import { SharePermission } from './document-share.entity';

@Injectable()
export class AccessPolicyService {
  canEdit(isOwner: boolean, permission?: SharePermission) {
    return isOwner || permission === SharePermission.Editor;
  }

  canShare(isOwner: boolean) {
    return isOwner;
  }
}
