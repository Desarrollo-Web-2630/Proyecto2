import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { Comparticion } from '../models/pool.model';
import { Proceso } from '../models/proceso.model';

// HU-23
@Injectable({ providedIn: 'root' })
export class ComparticionService {
  private readonly api = inject(ApiClient);

  obtener(procesoId: number): Promise<Comparticion> {
    return this.api.get<Comparticion>(`/v1/procesos/${procesoId}/comparticion`);
  }

  actualizar(procesoId: number, datos: Comparticion): Promise<Comparticion> {
    return this.api.put<Comparticion, Comparticion>(`/v1/procesos/${procesoId}/comparticion`, datos);
  }

  compartidosConmigo(): Promise<Proceso[]> {
    return this.api.get<Proceso[]>('/v1/procesos/compartidos');
  }
}
