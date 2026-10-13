import { Injectable, computed, signal } from '@angular/core';
import { RolAcceso, Usuario } from '../models/usuario.model';

const CLAVE = 'procesos.sesion';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly usuarioActual = signal<Usuario | null>(this.leer());

  readonly usuario = this.usuarioActual.asReadonly();
  readonly autenticado = computed(() => this.usuarioActual() !== null);
  readonly rol = computed<RolAcceso | null>(() => this.usuarioActual()?.rolAcceso ?? null);
  readonly esAdmin = computed(() => this.rol() === 'ADMIN');
  readonly empresaId = computed<number | null>(() => this.usuarioActual()?.empresaId ?? null);

  iniciar(usuario: Usuario): void {
    this.usuarioActual.set(usuario);
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(usuario));
    } catch {
      // Sin sessionStorage la sesión queda en memoria
    }
  }

  cerrar(): void {
    this.usuarioActual.set(null);
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      // se ignora
    }
  }

  private leer(): Usuario | null {
    try {
      const crudo = sessionStorage.getItem(CLAVE);
      if (!crudo) {
        return null;
      }
      const valor: unknown = JSON.parse(crudo);
      return esUsuario(valor) ? valor : null;
    } catch {
      return null;
    }
  }
}

function esUsuario(valor: unknown): valor is Usuario {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const v = valor as Partial<Record<keyof Usuario, unknown>>;
  return (
    typeof v.id === 'number' &&
    typeof v.correo === 'string' &&
    typeof v.empresaId === 'number' &&
    (v.rolAcceso === 'ADMIN' || v.rolAcceso === 'EDITOR' || v.rolAcceso === 'LECTURA')
  );
}
