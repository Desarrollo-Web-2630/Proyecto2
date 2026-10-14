import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { ActividadRequest } from '../models/actividad.model';
import { Actividad } from '../models/proceso.model';

// HU-08, HU-09 y HU-10
@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly api = inject(ApiClient);

  private base(procesoId: number): string {
    return `/v1/procesos/${procesoId}/actividades`;
  }

  listar(procesoId: number): Promise<Actividad[]> {
    return this.api.get<Actividad[]>(this.base(procesoId));
  }

  crear(procesoId: number, datos: ActividadRequest): Promise<Actividad> {
    return this.api.post<Actividad, ActividadRequest>(this.base(procesoId), datos);
  }

  // El PUT del backend exige el cuerpo completo (nombre, tipo, lane y posición)
  actualizar(procesoId: number, id: number, datos: ActividadRequest): Promise<Actividad> {
    return this.api.put<Actividad, ActividadRequest>(`${this.base(procesoId)}/${id}`, datos);
  }

  // Responde 204. El borrado es lógico y arrastra los arcos conectados (cascade en el backend)
  eliminar(procesoId: number, id: number): Promise<void> {
    return this.api.delete(`${this.base(procesoId)}/${id}`);
  }
}
