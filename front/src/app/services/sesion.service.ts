import { Injectable, computed, signal } from '@angular/core';
import { Sesion } from '../models/sesion.model';

const CLAVE = 'sesion';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly actual = signal<Sesion | null>(this.leer());

  readonly usuario = computed(() => this.actual()?.usuario ?? null);
  readonly esAdmin = computed(() => this.usuario()?.rolAcceso === 'ADMIN');

  iniciar(sesion: Sesion): void {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    this.actual.set(sesion);
  }

  cerrar(): void {
    sessionStorage.removeItem(CLAVE);
    this.actual.set(null);
  }

  // Token vigente o null; si ya venció se cierra la sesión
  token(): string | null {
    const sesion = this.actual();
    if (!sesion) {
      return null;
    }
    if (Date.now() >= sesion.expira) {
      this.cerrar();
      return null;
    }
    return sesion.token;
  }

  activa(): boolean {
    return this.token() !== null;
  }

  private leer(): Sesion | null {
    const texto = sessionStorage.getItem(CLAVE);
    if (!texto) {
      return null;
    }
    const sesion: Sesion = JSON.parse(texto);
    // Sesiones viejas sin token o ya vencidas no sirven
    if (!sesion.token || Date.now() >= sesion.expira) {
      sessionStorage.removeItem(CLAVE);
      return null;
    }
    return sesion;
  }
}
