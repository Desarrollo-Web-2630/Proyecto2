import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolAcceso } from '../models/usuario.model';
import { SesionService } from '../services/sesion.service';

// Oculta pantallas según el rol; el backend igual valida cada petición
export function rolGuard(...roles: RolAcceso[]): CanActivateFn {
  return () => {
    const rol = inject(SesionService).usuario()?.rolAcceso;
    return rol && roles.includes(rol) ? true : inject(Router).createUrlTree(['/procesos']);
  };
}
