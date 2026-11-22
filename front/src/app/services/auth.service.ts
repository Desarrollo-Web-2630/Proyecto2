import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { LoginRespuesta } from '../models/login-respuesta.model';
import { Sesion } from '../models/sesion.model';
import { LoginRequest, Usuario } from '../models/usuario.model';
import { ActivarCuentaRequest, VerificacionResponse } from '../models/verificacion.model';
import { SesionService } from './sesion.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  login(datos: LoginRequest): Observable<Sesion> {
    return this.http.post<LoginRespuesta>('/auth/login', datos).pipe(
      map(r => ({ token: r.token, expira: Date.now() + r.expiraEn * 1000, usuario: r.usuario })),
      tap(sesion => this.sesion.iniciar(sesion))
    );
  }

  // Datos del dueño del token, según el backend
  yo(): Observable<Usuario> {
    return this.http.get<Usuario>('/auth/yo');
  }

  logout(): Observable<void> {
    return this.http.post<void>('/auth/logout', {}).pipe(
      tap({
        next: () => this.sesion.cerrar(),
        error: () => this.sesion.cerrar()
      }),
      catchError(() => of(void 0))
    );
  }

  activarCuenta(datos: ActivarCuentaRequest): Observable<VerificacionResponse> {
    return this.http.post<VerificacionResponse>('/auth/activar-cuenta', datos);
  }

  reenviarVerificacion(correo: string): Observable<VerificacionResponse> {
    return this.http.post<VerificacionResponse>('/auth/reenviar-verificacion', { correo });
  }
}
