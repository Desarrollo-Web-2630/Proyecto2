import { Injectable, inject, signal } from '@angular/core';
import { api } from '../core/api';
import { PermisosPool } from '../models/permisos-pool.model';
import { SesionService } from './sesion.service';

@Injectable({ providedIn: 'root' })
export class PermisosPoolService {
  private readonly sesion = inject(SesionService);
  private readonly url = '/v1/permisos-pool';

  // Mientras no se configure nada, admin y editor pueden modificar
  readonly permisos = signal<PermisosPool>({
    crear: ['ADMIN', 'EDITOR'],
    editar: ['ADMIN', 'EDITOR'],
    eliminar: ['ADMIN', 'EDITOR']
  });

  get(): Promise<PermisosPool> {
    return api.get<PermisosPool>(this.url).then(r => {
      this.permisos.set(r.data);
      return r.data;
    });
  }

  update(permisos: PermisosPool): Promise<PermisosPool> {
    return api.put<PermisosPool>(this.url, permisos).then(r => {
      this.permisos.set(r.data);
      return r.data;
    });
  }

  puede(accion: keyof PermisosPool): boolean {
    const rol = this.sesion.usuario()?.rolAcceso;
    return rol !== undefined && rol !== 'LECTURA' && this.permisos()[accion].includes(rol);
  }
}
