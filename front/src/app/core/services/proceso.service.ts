import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { Actividad, Proceso } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly api = inject(ApiClient);
  private readonly base = '/v1/procesos';

  listar(incluirInactivos = false): Promise<Proceso[]> {
    return this.api.get<Proceso[]>(this.base, { params: { incluirInactivos } });
  }

  obtener(id: number): Promise<Proceso> {
    return this.api.get<Proceso>(`${this.base}/${id}`);
  }

  listarActividades(procesoId: number): Promise<Actividad[]> {
    return this.api.get<Actividad[]>(`${this.base}/${procesoId}/actividades`);
  }
}
