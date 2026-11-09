import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SesionService } from '../../services/sesion.service';
import { esPublica } from './auth.interceptor';

// 401 en una ruta privada = token vencido, inválido o revocado: se cierra la sesión y se va al login.
// 403 = autenticado pero sin permiso: se deja pasar para que la pantalla muestre el mensaje del backend.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !esPublica(req.url)) {
        sesion.cerrar('expirada');
        router.navigate(['/login'], { queryParams: { redirect: router.url, motivo: 'expirada' } });
      }
      return throwError(() => err);
    })
  );
};
