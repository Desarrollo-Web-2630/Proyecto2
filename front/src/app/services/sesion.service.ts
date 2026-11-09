import { Injectable, computed, signal } from '@angular/core';
import { leerPayload } from '../core/utils/jwt';
import { LoginResponse, Sesion } from '../models/sesion.model';
import { RolAcceso } from '../models/usuario.model';

const CLAVE = 'sesion';

// Por qué terminó la última sesión: lo usa el login para mostrar el aviso correcto
export type MotivoCierre = 'logout' | 'expirada';

// Estado de la sesión: token JWT + usuario autenticado.
// Se guarda en sessionStorage (se borra al cerrar la pestaña) y nunca guarda la contraseña.
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly actual = signal<Sesion | null>(this.leer());
  private readonly motivo = signal<MotivoCierre | null>(null);
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  readonly motivoCierre = this.motivo.asReadonly();

  readonly usuario = computed(() => this.actual()?.usuario ?? null);
  readonly token = computed(() => this.actual()?.token ?? null);
  readonly rol = computed<RolAcceso | null>(() => this.actual()?.usuario.rolAcceso ?? null);

  readonly esAdmin = computed(() => this.rol() === 'ADMIN');
  // ADMIN y EDITOR modifican; LECTURA solo consulta
  readonly puedeEditar = computed(() => this.rol() === 'ADMIN' || this.rol() === 'EDITOR');
  readonly soloLectura = computed(() => this.rol() === 'LECTURA');

  constructor() {
    this.programarExpiracion();
  }

  iniciar(respuesta: LoginResponse): void {
    const payload = leerPayload(respuesta.token);
    if (!payload) {
      throw new Error('El servidor devolvió un token inválido');
    }
    const sesion: Sesion = { token: respuesta.token, usuario: respuesta.usuario, expiraEn: payload.exp * 1000 };
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    this.motivo.set(null);
    this.actual.set(sesion);
    this.programarExpiracion();
  }

  cerrar(motivo: MotivoCierre = 'logout'): void {
    sessionStorage.removeItem(CLAVE);
    this.motivo.set(motivo);
    this.actual.set(null);
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
  }

  // Hay sesión y el token no ha expirado
  autenticado(): boolean {
    const sesion = this.actual();
    if (!sesion) {
      return false;
    }
    if (Date.now() >= sesion.expiraEn) {
      this.cerrar('expirada');
      return false;
    }
    return true;
  }

  tieneRol(roles: readonly RolAcceso[]): boolean {
    const rol = this.rol();
    return rol !== null && roles.includes(rol);
  }

  // Cierra la sesión sola cuando el token vence, aunque el usuario no haga nada
  private programarExpiracion(): void {
    const sesion = this.actual();
    if (!sesion) {
      return;
    }
    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }
    // setTimeout acepta como máximo ~24,8 días
    const restante = Math.min(sesion.expiraEn - Date.now(), 2_147_000_000);
    this.temporizador = setTimeout(() => this.cerrar('expirada'), Math.max(restante, 0));
  }

  private leer(): Sesion | null {
    try {
      const texto = sessionStorage.getItem(CLAVE);
      if (!texto) {
        return null;
      }
      const sesion: Partial<Sesion> = JSON.parse(texto);
      if (!sesion.token || !sesion.usuario || !sesion.expiraEn || Date.now() >= sesion.expiraEn) {
        sessionStorage.removeItem(CLAVE);
        return null;
      }
      return sesion as Sesion;
    } catch {
      return null;
    }
  }
}
