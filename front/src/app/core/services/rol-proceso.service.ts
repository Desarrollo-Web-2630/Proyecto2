import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { Page } from '../models/page.model';
import { RolProceso } from '../models/pool.model';
import { RolProcesoDetalle, RolProcesoRequest } from '../models/rol-proceso.model';

// HU-17 a HU-20: roles de proceso de la empresa (la función que se dibuja como lane)
@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly api = inject(ApiClient);
  private readonly base = '/v1/roles-proceso';

  // Catálogo completo (selectores de lane, permisos de pool…)
  listar(): Promise<RolProceso[]> {
    return this.api.get<RolProceso[]>(this.base);
  }

  // HU-20: búsqueda por nombre y paginación, con el uso de cada rol
  buscar(nombre: string, page: number, size: number): Promise<Page<RolProcesoDetalle>> {
    const params: Record<string, string | number> = { page, size };
    if (nombre) {
      params['nombre'] = nombre;
    }
    return this.api.get<Page<RolProcesoDetalle>>(`${this.base}/buscar`, { params });
  }

  obtener(id: number): Promise<RolProcesoDetalle> {
    return this.api.get<RolProcesoDetalle>(`${this.base}/${id}`);
  }

  // HU-17
  crear(datos: RolProcesoRequest): Promise<RolProcesoDetalle> {
    return this.api.post<RolProcesoDetalle, RolProcesoRequest>(this.base, datos);
  }

  // HU-18
  actualizar(id: number, datos: RolProcesoRequest): Promise<RolProcesoDetalle> {
    return this.api.put<RolProcesoDetalle, RolProcesoRequest>(`${this.base}/${id}`, datos);
  }

  // HU-19: borrado lógico; el backend responde 400 si el rol está en uso
  eliminar(id: number): Promise<void> {
    return this.api.delete(`${this.base}/${id}`);
  }
}
