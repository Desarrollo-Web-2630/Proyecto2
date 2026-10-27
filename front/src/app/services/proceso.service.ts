import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Page } from '../models/page.model';
import { Proceso, ProcesoFiltro, ProcesoRequest } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly url = '/v1/procesos';

  list(incluirInactivos = false): Promise<Proceso[]> {
    return api.get<Proceso[]>(this.url, { params: { incluirInactivos } }).then(r => r.data);
  }

  buscar(filtro: ProcesoFiltro): Promise<Page<Proceso>> {
    const params: Record<string, string | number | boolean> = {
      incluirInactivos: filtro.incluirInactivos ?? false,
      page: filtro.page ?? 0,
      size: filtro.size ?? 10
    };
    if (filtro.nombre) {
      params['nombre'] = filtro.nombre;
    }
    if (filtro.estado) {
      params['estado'] = filtro.estado;
    }
    if (filtro.categoria) {
      params['categoria'] = filtro.categoria;
    }
    return api.get<Page<Proceso>>(`${this.url}/buscar`, { params }).then(r => r.data);
  }

  get(id: number): Promise<Proceso> {
    return api.get<Proceso>(`${this.url}/${id}`).then(r => r.data);
  }

  create(proceso: ProcesoRequest): Promise<Proceso> {
    return api.post<Proceso>(this.url, proceso).then(r => r.data);
  }

  update(id: number, proceso: ProcesoRequest): Promise<Proceso> {
    return api.put<Proceso>(`${this.url}/${id}`, proceso).then(r => r.data);
  }

  publicar(id: number): Promise<Proceso> {
    return api.post<Proceso>(`${this.url}/${id}/publicar`).then(r => r.data);
  }

  inactivar(id: number): Promise<Proceso> {
    return api.post<Proceso>(`${this.url}/${id}/inactivar`).then(r => r.data);
  }

  reactivar(id: number): Promise<Proceso> {
    return api.post<Proceso>(`${this.url}/${id}/reactivar`).then(r => r.data);
  }

  delete(id: number): Promise<void> {
    return api.delete(`${this.url}/${id}`).then(() => undefined);
  }
}

