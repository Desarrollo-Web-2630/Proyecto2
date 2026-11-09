import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { LoginResponse } from '../models/sesion.model';
import { LoginRequest, Usuario } from '../models/usuario.model';
import { ActivarCuentaRequest, VerificacionResponse } from '../models/verificacion.model';
import { SesionService } from './sesion.service';

// Endpoints que no requieren token (el interceptor no le pone Authorization)
export const RUTAS_PUBLICAS: readonly string[] = [
  '/v1/usuarios/login',
  '/auth/activar-cuenta',
  '/auth/reenviar-verificacion'
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  login(datos: LoginRequest): Observable<Usuario> {
    return this.http.post<LoginResponse>('/v1/usuarios/login', datos).pipe(
      tap(respuesta => this.sesion.iniciar(respuesta)),
      map(respuesta => respuesta.usuario)
    );
  }

  logout(): void {
    this.sesion.cerrar();
  }

  activarCuenta(datos: ActivarCuentaRequest): Observable<VerificacionResponse> {
    return this.http.post<VerificacionResponse>('/auth/activar-cuenta', datos);
  }

  reenviarVerificacion(correo: string): Observable<VerificacionResponse> {
    return this.http.post<VerificacionResponse>('/auth/reenviar-verificacion', { correo });
  }
}
