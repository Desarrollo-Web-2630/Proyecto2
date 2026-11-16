import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

// Solo con sesión vigente; si no, al login
export const authGuard: CanActivateFn = () => {
  return inject(SesionService).activa() ? true : inject(Router).createUrlTree(['/login']);
};
