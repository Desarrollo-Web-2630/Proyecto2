import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient } from '../api-client';
import { AccionPool, PERMISOS_POOL_POR_DEFECTO, PermisosPool } from '../models/pool.model';
import { SesionService } from './sesion.service';

// HU-24
@Injectable({ providedIn: 'root' })
export class PermisosPoolService {
  private readonly api = inject(ApiClient);
  private readonly sesion = inject(SesionService);
  private readonly permisos = signal<PermisosPool>(PERMISOS_POOL_POR_DEFECTO);

  readonly actuales = this.permisos.asReadonly();

  readonly puede = computed(() => {
    const rol = this.sesion.rol();
    const permisos = this.permisos();
    return (accion: AccionPool): boolean => rol !== null && rol !== 'LECTURA' && permisos[accion].includes(rol);
  });

  async cargar(): Promise<PermisosPool> {
    const permisos = await this.api.get<PermisosPool>('/v1/permisos-pool');
    this.permisos.set(permisos);
    return permisos;
  }

  async guardar(permisos: PermisosPool): Promise<PermisosPool> {
    const guardados = await this.api.put<PermisosPool, PermisosPool>('/v1/permisos-pool', permisos);
    this.permisos.set(guardados);
    return guardados;
  }
}
