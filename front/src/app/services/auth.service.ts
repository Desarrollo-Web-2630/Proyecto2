import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Sesion } from '../models/sesion.model';
import { LoginRequest } from '../models/usuario.model';
import { ActivarCuentaRequest, VerificacionResponse } from '../models/verificacion.model';
import { SesionService } from './sesion.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  login(datos: LoginRequest): Observable<Sesion> {
    return this.http.post<Sesion>('/v1/usuarios/login', datos).pipe(tap(sesion => this.sesion.iniciar(sesion)));
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
