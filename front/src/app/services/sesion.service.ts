import { Injectable, computed, signal } from '@angular/core';
import { api } from '../core/api';
import { Sesion } from '../models/sesion.model';

const CLAVE = 'sesion';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly actual = signal<Sesion | null>(this.leer());

  readonly usuario = this.actual.asReadonly();
  readonly esAdmin = computed(() => this.actual()?.rolAcceso === 'ADMIN');

  constructor() {
    this.ponerEncabezado(this.actual());
  }

  iniciar(sesion: Sesion): void {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    this.actual.set(sesion);
    this.ponerEncabezado(sesion);
  }

  cerrar(): void {
    sessionStorage.removeItem(CLAVE);
    this.actual.set(null);
    this.ponerEncabezado(null);
  }

  private leer(): Sesion | null {
    const texto = sessionStorage.getItem(CLAVE);
    if (!texto) {
      return null;
    }
    const sesion: Sesion = JSON.parse(texto);
    return sesion;
  }

  // El backend identifica la empresa con este encabezado (entrega 2, sin token)
  private ponerEncabezado(sesion: Sesion | null): void {
    if (sesion) {
      api.defaults.headers.common['X-Empresa-Id'] = String(sesion.empresaId);
    } else {
      delete api.defaults.headers.common['X-Empresa-Id'];
    }
  }
}
