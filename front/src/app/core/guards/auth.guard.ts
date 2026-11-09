import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../../services/sesion.service';

// Solo con sesión vigente. Si no la hay, va al login y recuerda a dónde quería entrar.
export const authGuard: CanActivateFn = (_route, state) => {
  const sesion = inject(SesionService);
  if (sesion.autenticado()) {
    return true;
  }
  const queryParams: Record<string, string> = { redirect: state.url };
  if (sesion.motivoCierre() === 'expirada') {
    queryParams['motivo'] = 'expirada';
  }
  return inject(Router).createUrlTree(['/login'], { queryParams });
};
