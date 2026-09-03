import { AccessPolicyService } from './access-policy.service';
import { SharePermission } from './document-share.entity';

describe('AccessPolicyService', () => {
  const policy = new AccessPolicyService();

  it('allows owners and editors to edit, but rejects viewers', () => {
    expect(policy.canEdit(true)).toBe(true);
    expect(policy.canEdit(false, SharePermission.Editor)).toBe(true);
    expect(policy.canEdit(false, SharePermission.Viewer)).toBe(false);
  });

  it('allows only the owner to grant access', () => {
    expect(policy.canShare(true)).toBe(true);
    expect(policy.canShare(false)).toBe(false);
  });
});
