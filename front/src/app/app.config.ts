import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';
import { routes } from './app.routes';
import { apiInterceptor } from './core/api.interceptor';
import { AuthService } from './services/auth.service';
import { SesionService } from './services/sesion.service';

export function validarSesion(): Observable<unknown> {
  const sesion = inject(SesionService);
  if (!sesion.activa()) {
    return of(null);
  }
  const auth = inject(AuthService);
  return auth.yo().pipe(
    tap(usuario => sesion.actualizarUsuario(usuario)),
    catchError(() => {
      sesion.cerrar();
      return of(null);
    })
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(validarSesion)
  ]
};
