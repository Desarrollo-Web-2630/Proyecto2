import { Injectable, computed, signal } from '@angular/core';
import { Sesion } from '../models/sesion.model';

const CLAVE = 'sesion';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly actual = signal<Sesion | null>(this.leer());

  readonly usuario = this.actual.asReadonly();
  readonly esAdmin = computed(() => this.actual()?.rolAcceso === 'ADMIN');

  iniciar(sesion: Sesion): void {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    this.actual.set(sesion);
  }

  cerrar(): void {
    sessionStorage.removeItem(CLAVE);
    this.actual.set(null);
  }

  private leer(): Sesion | null {
    const texto = sessionStorage.getItem(CLAVE);
    if (!texto) {
      return null;
    }
    const sesion: Sesion = JSON.parse(texto);
    return sesion;
  }
}
