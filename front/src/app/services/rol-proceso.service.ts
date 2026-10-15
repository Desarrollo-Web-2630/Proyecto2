import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Page } from '../models/page.model';
import { RolProceso, RolProcesoRequest } from '../models/rol-proceso.model';

@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly url = '/v1/roles-proceso';

  list(): Promise<RolProceso[]> {
    return api.get<RolProceso[]>(this.url).then(r => r.data);
  }

  buscar(nombre: string, page: number, size: number): Promise<Page<RolProceso>> {
    return api.get<Page<RolProceso>>(`${this.url}/buscar`, { params: { nombre, page, size } }).then(r => r.data);
  }

  get(id: number): Promise<RolProceso> {
    return api.get<RolProceso>(`${this.url}/${id}`).then(r => r.data);
  }

  create(rol: RolProcesoRequest): Promise<RolProceso> {
    return api.post<RolProceso>(this.url, rol).then(r => r.data);
  }

  update(id: number, rol: RolProcesoRequest): Promise<RolProceso> {
    return api.put<RolProceso>(`${this.url}/${id}`, rol).then(r => r.data);
  }

  delete(id: number): Promise<void> {
    return api.delete(`${this.url}/${id}`).then(() => undefined);
  }
}
