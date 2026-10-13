import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolAcceso } from './models/usuario.model';
import { SesionService } from './services/sesion.service';

// Solo con sesión
export const autenticadoGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.autenticado() ? true : inject(Router).createUrlTree(['/login']);
};

// Solo sin sesión (login, registro)
export const invitadoGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.autenticado() ? inject(Router).createUrlTree(['/procesos']) : true;
};

// Solo para ciertos roles de acceso
export function rolGuard(...roles: RolAcceso[]): CanActivateFn {
  return () => {
    const rol = inject(SesionService).rol();
    return rol !== null && roles.includes(rol) ? true : inject(Router).createUrlTree(['/procesos']);
  };
}
