import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SesionService } from '../services/sesion.service';

export const ENCABEZADO_EMPRESA = 'X-Empresa-Id';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const empresaId = inject(SesionService).usuario()?.empresaId;
  let headers = req.headers;
  if (empresaId !== undefined && !headers.has(ENCABEZADO_EMPRESA)) {
    headers = headers.set(ENCABEZADO_EMPRESA, String(empresaId));
  }
  return next(req.clone({ url: `/api${req.url}`, headers }));
};
