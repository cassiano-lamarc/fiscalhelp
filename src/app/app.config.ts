import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withXsrfConfiguration, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/auth/jwt-interceptor';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withXsrfConfiguration({cookieName:'XSRF-TOKEN',headerName:'X-XSRF-TOKEN'}), withInterceptors([jwtInterceptor])),
    {provide:LOCALE_ID,useValue:'pt-BR'}
  ]
};
