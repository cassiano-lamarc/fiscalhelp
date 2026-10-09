import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/http/api.service';

@Component({selector:'app-auth', imports:[MatProgressSpinnerModule], templateUrl:'./auth.html', styleUrl:'./auth.scss'})
export class Auth implements OnInit {
  api = inject(ApiService);
  private route = inject(ActivatedRoute);
  loading = signal(true);
  busy = signal(false);
  available = signal(false);
  message = signal('');
  async ngOnInit() {
    try {
      const providers = await this.api.request<{google:boolean}>('GET','/auth/providers');
      this.available.set(providers.google);
      const error = this.route.snapshot.queryParamMap.get('erro');
      if (error) this.message.set(error === 'migracao'
        ? 'Esta conta foi criada com outro método. Solicite a vinculação segura ao Google para preservar seus documentos.'
        : 'Não foi possível entrar com Google. Tente novamente.');
    } catch { this.message.set('Não foi possível consultar o acesso. Recarregue a página para tentar novamente.'); }
    finally { this.loading.set(false); }
  }
  continue() {
    if (this.busy() || !this.available()) return;
    this.busy.set(true);
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    const destination = value && /^\/(orcamentos(?:\/(?:novo|[a-f0-9-]{36}))?|empresa|dados-usuario)$/.test(value) ? value : '/orcamentos';
    window.location.assign(this.api.url('/auth/google/start?returnUrl=' + encodeURIComponent(destination)));
  }
}
