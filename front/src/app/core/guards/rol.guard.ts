import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolAcceso } from '../../models/usuario.model';
import { SesionService } from '../../services/sesion.service';

// Restringe una ruta a ciertos roles de acceso:
//   { path: 'nuevo', canActivate: [rolGuard('ADMIN', 'EDITOR')], ... }
// Es solo interfaz: el backend vuelve a verificar el rol en cada petición.
export function rolGuard(...roles: RolAcceso[]): CanActivateFn {
  return () => {
    const sesion = inject(SesionService);
    return sesion.tieneRol(roles) ? true : inject(Router).createUrlTree(['/acceso-denegado']);
  };
}
