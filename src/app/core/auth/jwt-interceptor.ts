import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../http/api.config';
import { JwtSession } from './jwt-session';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(JwtSession);
  if (request.url !== API_URL && !request.url.startsWith(API_URL + '/')) return next(request);
  const token = session.accessToken();
  if (token) request = request.clone({setHeaders:{Authorization:`Bearer ${token}`},withCredentials:false});
  return next(request).pipe(catchError(error => {
    if (error.status === 401) session.clear();
    return throwError(() => error);
  }));
};
