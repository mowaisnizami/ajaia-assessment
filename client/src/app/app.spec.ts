import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the document workspace', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Documents');
  });

  it('keeps ordered list items as separate PDF blocks', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as unknown as {
      pdfBlocks(html: string): Array<{ kind: string; text: string; position?: number }>;
    };

    const blocks = app.pdfBlocks('<ol><li>First task</li><li>Second task</li></ol>');

    expect(blocks).toEqual([
      { kind: 'list', text: 'First task', depth: 0, ordered: true, position: 1 },
      { kind: 'list', text: 'Second task', depth: 0, ordered: true, position: 2 },
    ]);
  });
});
