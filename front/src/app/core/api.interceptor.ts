import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SesionService } from '../services/sesion.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const token = sesion.token();

  // La empresa y el rol viajan dentro del JWT; el backend no confía en nada más
  const headers = token ? req.headers.set('Authorization', `Bearer ${token}`) : req.headers;

  return next(req.clone({ url: `/api${req.url}`, headers })).pipe(
    catchError((err: unknown) => {
      // Token vencido o inválido: se cierra la sesión y se vuelve al login
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.startsWith('/auth/')) {
        sesion.cerrar();
        router.navigate(['/login'], { queryParams: { expirada: true } });
      }
      return throwError(() => err);
    })
  );
};
