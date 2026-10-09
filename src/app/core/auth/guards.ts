import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { ApiService } from '../http/api.service';

export const guestGuard: CanActivateFn = async () => {
  const api=inject(ApiService), router=inject(Router);
  const session=await api.loadSession();
  if (!session) return true;
  await router.navigate([session.onboardingComplete?'/orcamentos':'/empresa'],{replaceUrl:true});
  return false;
};
export const sessionGuard: CanActivateFn = async (_route,state) => {
  const api=inject(ApiService),router=inject(Router);
  return await api.loadSession() ? true : router.createUrlTree(['/entrar'],{queryParams:{returnUrl:state.url}});
};
export const onboardingGuard: CanActivateFn = async (_route,state) => {
  const api=inject(ApiService),router=inject(Router);
  const session=await api.loadSession();
  return !session?router.createUrlTree(['/entrar'],{queryParams:{returnUrl:state.url}})
    :session.onboardingComplete?true:router.createUrlTree(['/empresa']);
};
export const dirtyGuard: CanDeactivateFn<{hasChanges():boolean}> = component =>
  !component.hasChanges() || confirm('Há alterações não salvas. Deseja sair?');
