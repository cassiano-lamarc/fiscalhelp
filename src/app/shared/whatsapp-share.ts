import { Component, ElementRef, ViewChild, inject, input, signal, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ApiService, Quote } from '../core/http/api.service';
import { quotePdfFilename } from './quote-pdf-filename';

@Component({
  selector: 'app-whatsapp-share',
  imports: [MatButtonModule],
  template: `
    <button mat-stroked-button type="button" class="whatsapp" [disabled]="disabled() || loading()" (click)="open()">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.85 11.85 0 0 0 12.04 0C5.5 0 .18 5.32.18 11.86c0 2.09.55 4.13 1.59 5.93L.08 24l6.35-1.67a11.86 11.86 0 0 0 5.61 1.43h.01c6.54 0 11.86-5.32 11.87-11.86a11.8 11.8 0 0 0-3.4-8.42ZM12.05 21.76a9.85 9.85 0 0 1-5.03-1.38l-.36-.21-3.77.99 1.01-3.68-.24-.38a9.84 9.84 0 0 1-1.51-5.24c0-5.44 4.43-9.87 9.89-9.87a9.81 9.81 0 0 1 7 2.9 9.81 9.81 0 0 1 2.89 7.01c0 5.44-4.44 9.86-9.88 9.86Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.77-1.64-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.34Z"/></svg>
      Compartilhar no WhatsApp
    </button>
    <dialog #dialog (close)="release()">
      <h2>Compartilhar orçamento</h2>
      @if(loading()){<p role="status">Preparando o PDF…</p>}
      @else if(file()){
        <p>{{file()!.name}}</p>
        @if(canShareFile()){
          <p>Selecione o WhatsApp na próxima tela e escolha o destinatário.</p>
          <button mat-flat-button type="button" [disabled]="sharing()" (click)="shareFile()">Compartilhar PDF</button>
        }@else{
          <p>Baixe o PDF e anexe-o na conversa do WhatsApp.</p>
          <a mat-flat-button [href]="downloadUrl()" [download]="file()!.name">Baixar PDF</a>
          <a mat-stroked-button [href]="whatsappUrl()" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
        }
      }
      @if(error()){<p role="alert">{{error()}}</p>}
      <button mat-button type="button" (click)="dialog.close()">Fechar</button>
    </dialog>
  `,
  styles: `:host{display:inline-block}.whatsapp{color:#128c4a;gap:8px}svg{width:20px;height:20px;vertical-align:middle;margin-right:8px}dialog{border:1px solid #dce5df;border-radius:12px;padding:24px;max-width:440px;width:calc(100vw - 80px);color:#263c30}dialog::backdrop{background:#0006}h2{font-size:21px;margin-top:0}p{line-height:1.6;overflow-wrap:anywhere}dialog button,dialog a{margin:8px 8px 0 0}:host-context(.summary){display:block}.whatsapp{width:100%}`,
})
export class WhatsappShare implements OnDestroy {
  private api = inject(ApiService);
  quote = input<Quote | null>(null);
  prepare = input<(() => Promise<Quote | null>) | undefined>();
  disabled = input(false);
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  loading = signal(false);
  sharing = signal(false);
  file = signal<File | null>(null);
  error = signal('');
  downloadUrl = signal('');
  whatsappUrl = signal('');
  canShareFile = signal(false);
  private generation = 0;

  async open() {
    const generation = ++this.generation;
    this.error.set(''); this.loading.set(true);
    this.dialog.nativeElement.showModal();
    try {
      const prepare = this.prepare();
      const quote = prepare ? await prepare() : this.quote();
      if (generation !== this.generation) return;
      if (!quote) { this.dialog.nativeElement.close(); return; }
      const blob = await this.api.pdf(quote.id);
      if (generation !== this.generation) return;
      const file = new File([blob], quotePdfFilename(quote), { type: 'application/pdf' });
      this.file.set(file);
      this.downloadUrl.set(URL.createObjectURL(file));
      this.canShareFile.set(!!navigator.canShare?.({ files: [file] }));
      const company = quote.snapshot?.name || this.api.session()?.company?.name || '';
      const text = `Olá! Segue o orçamento ${quote.number}${company ? ' da empresa ' + company : ''}.`;
      this.whatsappUrl.set('https://wa.me/?text=' + encodeURIComponent(text));
    } catch {
      if (generation === this.generation) this.error.set('Não foi possível preparar o PDF. Feche e tente novamente.');
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  async shareFile() {
    const file = this.file();
    if (!file || this.sharing()) return;
    this.error.set(''); this.sharing.set(true);
    try {
      await navigator.share({ files: [file], title: 'Orçamento' });
      this.dialog.nativeElement.close();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.canShareFile.set(false);
        this.error.set('Não foi possível compartilhar diretamente. Baixe o PDF e anexe-o no WhatsApp.');
      }
    } finally { this.sharing.set(false); }
  }

  release() {
    ++this.generation;
    if (this.downloadUrl()) URL.revokeObjectURL(this.downloadUrl());
    this.downloadUrl.set(''); this.file.set(null); this.loading.set(false);
  }
  ngOnDestroy() { this.release(); }
}
