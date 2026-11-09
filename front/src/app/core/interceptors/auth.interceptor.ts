import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RUTAS_PUBLICAS } from '../../services/auth.service';
import { SesionService } from '../../services/sesion.service';

// Agrega Authorization: Bearer <token> a toda petición privada.
// La empresa NO se envía desde el front: el backend la toma del token firmado,
// así nadie puede cambiar un encabezado para ver datos de otra empresa.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  if (esPublica(req.url) || !sesion.autenticado()) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${sesion.token()}` } }));
};

export function esPublica(url: string): boolean {
  const ruta = url.replace(/^\/api/, '').split('?')[0];
  return RUTAS_PUBLICAS.includes(ruta);
}
