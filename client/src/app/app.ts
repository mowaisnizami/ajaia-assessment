import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { QuillEditorComponent } from 'ngx-quill';
import {
  CollaboratorPresence,
  DemoUser,
  DocumentModel,
  DocumentVersion,
} from './api.models';
import { ApiService } from './api.service';

type PdfBlock = {
  text: string;
  kind: 'heading' | 'paragraph' | 'list';
  level?: number;
  depth?: number;
  ordered?: boolean;
  position?: number;
};

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, QuillEditorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  users: DemoUser[] = [];
  currentUserId = localStorage.getItem('docflow-user') ?? '';
  owned: DocumentModel[] = [];
  shared: DocumentModel[] = [];
  selected: DocumentModel | null = null;
  versions: DocumentVersion[] = [];
  collaborators: CollaboratorPresence[] = [];
  editorTitle = '';
  editorContent = '';
  shareEmail = 'collaborator@docflow.test';
  sharePermission: 'VIEWER' | 'EDITOR' = 'VIEWER';
  loading = true;
  saving = false;
  exporting = false;
  notice = '';
  error = '';
  private presenceTimer?: number;

  readonly editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  };

  constructor(
    private readonly api: ApiService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.api.users().subscribe({
      next: (users) => {
        this.users = users;
        if (!users.some((user) => user.id === this.currentUserId)) {
          this.currentUserId = users[0]?.id ?? '';
        }
        this.api.setUser(this.currentUserId);
        this.loadDocuments();
        this.refreshView();
      },
      error: (error) => this.handleError(error),
    });
  }

  ngOnDestroy() {
    this.stopPresencePolling();
  }

  get currentUser() {
    return this.users.find((user) => user.id === this.currentUserId);
  }

  get shareableUsers() {
    return this.users.filter((user) => user.id !== this.selected?.ownerId);
  }

  get activeCollaboratorCount() {
    return this.collaborators.filter((person) => person.online).length;
  }

  switchUser() {
    this.stopPresencePolling();
    this.api.setUser(this.currentUserId);
    this.selected = null;
    this.versions = [];
    this.collaborators = [];
    this.notice = '';
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading = true;
    this.api.documents().subscribe({
      next: ({ owned, shared }) => {
        this.owned = owned;
        this.shared = shared;
        this.loading = false;
        this.refreshView();
      },
      error: (error) => this.handleError(error),
    });
  }

  createDocument() {
    this.clearMessages();
    this.api.createDocument().subscribe({
      next: (document) => {
        this.openDocument(document.id);
        this.loadDocuments();
      },
      error: (error) => this.handleError(error),
    });
  }

  openDocument(id: string) {
    this.clearMessages();
    this.stopPresencePolling();
    this.api.getDocument(id).subscribe({
      next: (document) => {
        this.selected = document;
        this.editorTitle = document.title;
        this.editorContent = document.content;
        this.loadVersions();
        this.heartbeatPresence();
        this.startPresencePolling();
        this.refreshView();
      },
      error: (error) => this.handleError(error),
    });
  }

  closeEditor() {
    this.stopPresencePolling();
    this.selected = null;
    this.versions = [];
    this.collaborators = [];
    this.clearMessages();
    this.loadDocuments();
  }

  saveDocument() {
    if (!this.selected || !this.canEdit) return;
    this.saving = true;
    this.clearMessages();
    this.api
      .updateDocument(this.selected.id, this.editorTitle, this.editorContent)
      .subscribe({
        next: (document) => {
          this.selected = document;
          this.editorTitle = document.title;
          this.editorContent = document.content;
          this.notice = 'Document saved and version recorded';
          this.saving = false;
          this.loadVersions();
          this.heartbeatPresence();
          this.refreshView();
        },
        error: (error) => {
          this.saving = false;
          this.handleError(error);
        },
      });
  }

  shareDocument() {
    if (!this.selected || this.selected.access !== 'OWNER') return;
    this.clearMessages();
    this.api
      .shareDocument(
        this.selected.id,
        this.shareEmail.trim(),
        this.sharePermission,
      )
      .subscribe({
        next: () => {
          this.notice = `Shared as ${this.sharePermission.toLowerCase()}`;
          this.heartbeatPresence();
          this.refreshView();
        },
        error: (error) => this.handleError(error),
      });
  }

  setShareRecipient(email: string) {
    this.shareEmail = email;
  }

  importFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.clearMessages();
    this.api.importDocument(file).subscribe({
      next: (document) => {
        input.value = '';
        this.loadDocuments();
        this.openDocument(document.id);
      },
      error: (error) => this.handleError(error),
    });
  }

  async exportPdf() {
    if (!this.selected || this.exporting) return;
    this.exporting = true;
    this.clearMessages();
    this.refreshView();

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 48;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const blocks = this.pdfBlocks(this.editorContent);
      let y = margin;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      const titleLines = pdf.splitTextToSize(this.editorTitle, pageWidth - margin * 2);
      pdf.text(titleLines, margin, y);
      y += titleLines.length * 24 + 10;
      pdf.setDrawColor(210, 215, 222);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 20;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(91, 100, 112);
      pdf.text(`Exported from DocFlow - ${new Date().toLocaleString()}`, margin, y);
      y += 26;
      pdf.setTextColor(32, 38, 47);

      for (const block of blocks.length ? blocks : [{ text: 'Empty document', kind: 'paragraph' as const }]) {
        const isHeading = block.kind === 'heading';
        const fontSize = isHeading ? 16 - Math.min(block.level ?? 1, 3) * 2 : 11;
        const lineHeight = isHeading ? fontSize + 7 : 17;
        const indent = block.kind === 'list' ? (block.depth ?? 0) * 18 : 0;
        const marker = block.kind === 'list'
          ? block.ordered
            ? `${block.position}. `
            : '• '
          : '';
        pdf.setFont('helvetica', isHeading ? 'bold' : 'normal');
        pdf.setFontSize(fontSize);
        const markerWidth = marker ? pdf.getTextWidth(marker) + 5 : 0;
        const lines = pdf.splitTextToSize(block.text, pageWidth - margin * 2 - indent - markerWidth);
        const blockHeight = lines.length * lineHeight + (isHeading ? 8 : 6);

        if (y + blockHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }

        if (marker) pdf.text(marker, margin + indent, y);
        pdf.text(lines, margin + indent + markerWidth, y);
        y += blockHeight;
      }

      pdf.save(`${this.editorTitle.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'document'}.pdf`);
      this.notice = 'PDF download prepared';
    } catch {
      this.error = 'PDF export could not be prepared. Please try again.';
    } finally {
      this.exporting = false;
      this.refreshView();
    }
  }

  get canEdit() {
    return this.selected?.access === 'OWNER' || this.selected?.access === 'EDITOR';
  }

  private loadVersions() {
    if (!this.selected) return;
    this.api.versions(this.selected.id).subscribe({
      next: (versions) => {
        this.versions = versions;
        this.refreshView();
      },
      error: (error) => this.handleError(error),
    });
  }

  private heartbeatPresence() {
    if (!this.selected) return;
    this.api.presence(this.selected.id).subscribe({
      next: (collaborators) => {
        this.collaborators = collaborators;
        this.refreshView();
      },
      error: (error) => this.handleError(error),
    });
  }

  private startPresencePolling() {
    this.presenceTimer = window.setInterval(() => this.heartbeatPresence(), 12_000);
  }

  private stopPresencePolling() {
    if (this.presenceTimer) window.clearInterval(this.presenceTimer);
    this.presenceTimer = undefined;
  }

  private pdfBlocks(html: string): PdfBlock[] {
    const root = globalThis.document.createElement('div');
    root.innerHTML = html;
    const blocks: PdfBlock[] = [];

    const readText = (element: HTMLElement) => {
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('ul, ol').forEach((list) => list.remove());
      clone.querySelectorAll('br').forEach((lineBreak) => lineBreak.replaceWith('\n'));
      return (clone.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
    };

    const walk = (element: HTMLElement, depth = 0) => {
      const tag = element.tagName.toLowerCase();
      if (/^h[1-3]$/.test(tag)) {
        const text = readText(element);
        if (text) blocks.push({ text, kind: 'heading', level: Number(tag[1]) });
        return;
      }
      if (tag === 'p' || tag === 'blockquote') {
        const text = readText(element);
        if (text) blocks.push({ text, kind: 'paragraph' });
        return;
      }
      if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(element.children).filter(
          (child): child is HTMLElement => child.tagName.toLowerCase() === 'li',
        );
        items.forEach((item, index) => {
          const text = readText(item);
          if (text) {
            blocks.push({
              text,
              kind: 'list',
              depth,
              ordered: tag === 'ol',
              position: index + 1,
            });
          }
          Array.from(item.children)
            .filter((child): child is HTMLElement => ['ul', 'ol'].includes(child.tagName.toLowerCase()))
            .forEach((list) => walk(list, depth + 1));
        });
        return;
      }
      Array.from(element.children).forEach((child) => walk(child as HTMLElement, depth));
    };

    Array.from(root.children).forEach((child) => walk(child as HTMLElement));
    return blocks;
  }

  private clearMessages() {
    this.notice = '';
    this.error = '';
  }

  private handleError(error: HttpErrorResponse) {
    this.loading = false;
    this.error =
      error.error?.message ?? 'The request could not be completed. Check the API.';
    this.refreshView();
  }

  private refreshView() {
    this.changeDetector.detectChanges();
  }
}
