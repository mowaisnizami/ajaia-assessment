export type AccessRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
}

export interface DocumentModel {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  access: AccessRole;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentLists {
  owned: DocumentModel[];
  shared: DocumentModel[];
}

export interface DocumentVersion {
  id: string;
  version: number;
  title: string;
  editedBy: DemoUser;
  createdAt: string;
}

export interface CollaboratorPresence {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
  online: boolean;
  lastSeenAt: string | null;
}
