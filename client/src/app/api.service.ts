import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import {
  CollaboratorPresence,
  DemoUser,
  DocumentLists,
  DocumentModel,
  DocumentVersion,
} from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private userId = localStorage.getItem('docflow-user') ?? '';

  constructor(private readonly http: HttpClient) {}

  setUser(userId: string) {
    this.userId = userId;
    localStorage.setItem('docflow-user', userId);
  }

  users() {
    return this.http.get<DemoUser[]>(`${environment.apiUrl}/users`);
  }

  documents() {
    return this.http.get<DocumentLists>(`${environment.apiUrl}/documents`, {
      headers: this.headers(),
    });
  }

  createDocument() {
    return this.http.post<DocumentModel>(
      `${environment.apiUrl}/documents`,
      { title: 'Untitled document' },
      { headers: this.headers() },
    );
  }

  getDocument(id: string) {
    return this.http.get<DocumentModel>(`${environment.apiUrl}/documents/${id}`, {
      headers: this.headers(),
    });
  }

  updateDocument(id: string, title: string, content: string) {
    return this.http.patch<DocumentModel>(
      `${environment.apiUrl}/documents/${id}`,
      { title, content },
      { headers: this.headers() },
    );
  }

  importDocument(file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<DocumentModel>(
      `${environment.apiUrl}/documents/import`,
      body,
      { headers: this.headers() },
    );
  }

  shareDocument(id: string, email: string, permission: 'VIEWER' | 'EDITOR') {
    return this.http.post(
      `${environment.apiUrl}/documents/${id}/shares`,
      { email, permission },
      { headers: this.headers() },
    );
  }

  versions(id: string) {
    return this.http.get<DocumentVersion[]>(
      `${environment.apiUrl}/documents/${id}/versions`,
      { headers: this.headers() },
    );
  }

  presence(id: string) {
    return this.http.post<CollaboratorPresence[]>(
      `${environment.apiUrl}/documents/${id}/presence`,
      {},
      { headers: this.headers() },
    );
  }

  private headers() {
    return new HttpHeaders({ 'x-user-id': this.userId });
  }
}
