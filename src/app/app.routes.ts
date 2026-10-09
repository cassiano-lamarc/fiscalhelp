import { Routes } from '@angular/router';
import { guestGuard, sessionGuard, onboardingGuard, dirtyGuard } from './core/auth/guards';
export const routes: Routes = [
  {path:'auth/callback',title:'Fiscal Help — Concluindo login',loadComponent:()=>import('./features/auth/auth-callback').then(m=>m.AuthCallback)},
  {path:'',title:'Fiscal Help — Orçamentos profissionais',loadComponent:()=>import('./features/home/home').then(m=>m.Home)},
  ...['entrar','criar-conta','login','register'].map(path=>({path,title:'Fiscal Help — Continuar com Google',canActivate:[guestGuard],loadComponent:()=>import('./features/auth/auth').then(m=>m.Auth)})),
  ...['recuperar','verificar','redefinir','telefone'].map(path=>({path,redirectTo:'entrar'})),
  {path:'empresa',title:'Fiscal Help — Minha empresa',canActivate:[sessionGuard],canDeactivate:[dirtyGuard],loadComponent:()=>import('./features/company/company').then(m=>m.Company)},
  {path:'dados-usuario',title:'Fiscal Help — Dados do usuário',canActivate:[sessionGuard],canDeactivate:[dirtyGuard],loadComponent:()=>import('./features/profile/profile').then(m=>m.Profile)},
  {path:'orcamentos',title:'Fiscal Help — Meus orçamentos',canActivate:[onboardingGuard],loadComponent:()=>import('./features/quotes/quote-list').then(m=>m.QuoteList)},
  {path:'orcamentos/novo',title:'Fiscal Help — Novo orçamento',canActivate:[onboardingGuard],canDeactivate:[dirtyGuard],loadComponent:()=>import('./features/quotes/quote-editor').then(m=>m.QuoteEditor)},
  {path:'orcamentos/:id',title:'Fiscal Help — Editar orçamento',canActivate:[onboardingGuard],canDeactivate:[dirtyGuard],loadComponent:()=>import('./features/quotes/quote-editor').then(m=>m.QuoteEditor)},
  {path:'**',redirectTo:''}
];
