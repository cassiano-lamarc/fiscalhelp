import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from './core/http/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  api = inject(ApiService);
  router = inject(Router);
  constructor() { void this.api.loadSession(); }
  async logout() { try { await this.api.request('POST','/auth/logout'); this.api.session.set(null); await this.api.csrf(); await this.router.navigate(['/']); } catch {} }
}
