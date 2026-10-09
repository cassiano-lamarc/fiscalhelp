import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/http/api.service';

@Component({selector:'app-auth-callback',template:'<section class="panel"><p>Concluindo login…</p></section>'})
export class AuthCallback implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  async ngOnInit() {
    const session = await this.api.loadSession();
    await this.router.navigateByUrl(session ? this.api.loginReturnUrl : '/entrar?erro=google', {replaceUrl:true});
  }
}
