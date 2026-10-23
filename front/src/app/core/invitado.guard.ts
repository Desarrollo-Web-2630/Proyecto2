import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

// Solo sin sesión: quien ya inició sesión va directo a /procesos
export const invitadoGuard: CanActivateFn = () => {
  return inject(SesionService).usuario() ? inject(Router).createUrlTree(['/procesos']) : true;
};
