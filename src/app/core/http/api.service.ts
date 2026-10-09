import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';
import { API_URL } from './api.config';

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  logoAssetId: string | null;
  showHeaderLogo: boolean;
  showWatermark: boolean;
  confirmedAtUtc: string | null;
  version: number;
}
export interface Session {
  planTier: 'Free' | 'Paid';
  pdfBranding: { showOriginBranding: boolean; text: string; url: string };
  quota: { used: number; limit: number | null; remaining: number | null };
  hasGoogleLogin: boolean;
  id: string;
  email: string | null;
  phoneNumber: string | null;
  onboardingComplete: boolean;
  company: Company | null;
}
export interface Item {
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal?: string;
}
export interface Quote {
  id: string;
  number: string;
  issueDate: string;
  issuedAtUtc: string | null;
  vehicleName: string | null;
  vehicleNumber: string | null;
  licensePlate: string | null;
  subject: string | null;
  validityDays: number | null;
  commercialConditions: CommercialConditions;
  includeContactPhone: boolean;
  contactPhone: string | null;
  includePreparedByName: boolean;
  preparedByName: string | null;
  customerName: string | null;
  items: Item[];
  discountAmount: string;
  subtotal: string;
  total: string;
  version: number;
  snapshot?: { name: string };
}
export interface QuoteInput {
  issueDate: string;
  customerName: string;
  items: Item[];
  discountAmount: string;
  version?: number;
  vehicleName?: string | null;
  vehicleNumber?: string | null;
  licensePlate?: string | null;
  subject?: string | null;
  validityDays?: number | null;
  commercialConditions?: CommercialConditions;
  includeContactPhone?: boolean;
  contactPhone?: string | null;
  includePreparedByName?: boolean;
  preparedByName?: string | null;
}
export interface CommercialConditions {
  includePaymentTerms: boolean; paymentTerms: string | null;
  includeWarranty: boolean; warrantyTerms: string | null;
  includeNotes: boolean; notes: string | null;
}
export interface UserProfile { contactPhone: string | null; preparedByName: string | null; version: number; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = API_URL;
  private csrfToken = '';
  url(path: string) { return this.baseUrl + path; }
  private http = inject(HttpClient);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  sessionResolved = signal(false);
  fieldErrors = signal<Record<string, string[]>>({});
  private pendingSession?: Promise<Session | null>;
  session = signal<Session | null>(null);
  error = signal('');
  notice = signal('');
  async request<T>(method: string, path: string, body?: unknown, key?: string): Promise<T> {
    let headers = new HttpHeaders();
    if (key) headers = headers.set('Idempotency-Key', key);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
      if (!this.csrfToken) await this.csrf();
      headers = headers.set('X-XSRF-TOKEN', this.csrfToken);
    }
    try {
      return await firstValueFrom(
        this.http.request<T>(method, this.url(path), { body, headers, withCredentials: true }),
      );
    } catch (error) {
      const e = error as HttpErrorResponse;
      const message =
        e.error?.detail ||
        e.error?.title ||
        (e.status === 401
          ? 'Entre na sua conta para continuar.'
          : 'Não foi possível conectar. Tente novamente.');
      this.error.set(message);
      this.fieldErrors.set(e.error?.fieldErrors || {});
      if (e.status === 401 && this.session()) {
        this.session.set(null);
        void this.router.navigate(['/entrar'], { replaceUrl: true });
      }
      throw error;
    }
  }
  async csrf() {
    const response = await this.request<{token: string}>('GET', '/auth/csrf');
    this.csrfToken = response.token;
    return response.token;
  }
  async loadSession() {
    if (this.pendingSession) return this.pendingSession;
    this.pendingSession = this.resolveSession();
    try { return await this.pendingSession; } finally { this.pendingSession = undefined; }
  }
  private async resolveSession() {
    try {
      this.session.set(
        await firstValueFrom(this.http.get<Session>(this.url('/me'), { withCredentials: true })),
      );
    } catch {
      this.session.set(null);
    }
    try { await this.csrf(); } catch {} finally { this.sessionResolved.set(true); }
    return this.session();
  }
  async pdf(id: string) {
    return firstValueFrom(
      this.http.get(this.url('/quotes/' + id + '/pdf'), {
        responseType: 'blob',
        withCredentials: true,
      }).pipe(catchError(error => {
        if(error.status===401){this.session.set(null);void this.router.navigate(['/entrar'],{replaceUrl:true});}
        return throwError(()=>error);
      })),
    );
  }
  listQuotes(pageIndex:number, pageSize:number) {
    return this.http.get<{items:Quote[];totalCount:number;page:number;pageSize:number}>(
      this.url('/quotes'), {params:{page:pageIndex+1,pageSize},withCredentials:true},
    ).pipe(catchError(error => { this.error.set('Não foi possível carregar os orçamentos. Tente novamente.'); if(error.status===401){this.session.set(null);void this.router.navigate(['/entrar'],{replaceUrl:true});}return throwError(()=>error); }));
  }
  constructor() {
    // Preserve existing callers while routing transient messages through one service.
    effect(() => { const message = this.error(); if (message) { this.notifications.show(message, 'error'); this.error.set(''); } });
    effect(() => { const message = this.notice(); if (message) { this.notifications.show(message); this.notice.set(''); } });
  }
}
