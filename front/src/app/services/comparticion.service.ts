import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Comparticion } from '../models/comparticion.model';
import { Proceso } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ComparticionService {
  get(procesoId: number): Promise<Comparticion> {
    return api.get<Comparticion>(`/v1/procesos/${procesoId}/comparticion`).then(r => r.data);
  }

  update(procesoId: number, comparticion: Comparticion): Promise<Comparticion> {
    return api.put<Comparticion>(`/v1/procesos/${procesoId}/comparticion`, comparticion).then(r => r.data);
  }

  // Procesos de otras empresas compartidos con la mía
  listCompartidos(): Promise<Proceso[]> {
    return api.get<Proceso[]>('/v1/procesos/compartidos').then(r => r.data);
  }
}
