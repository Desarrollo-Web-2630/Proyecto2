import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Actividad, ActividadRequest } from '../models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private url(procesoId: number): string {
    return `/v1/procesos/${procesoId}/actividades`;
  }

  list(procesoId: number): Promise<Actividad[]> {
    return api.get<Actividad[]>(this.url(procesoId)).then(r => r.data);
  }

  get(procesoId: number, id: number): Promise<Actividad> {
    return api.get<Actividad>(`${this.url(procesoId)}/${id}`).then(r => r.data);
  }

  create(procesoId: number, actividad: ActividadRequest): Promise<Actividad> {
    return api.post<Actividad>(this.url(procesoId), actividad).then(r => r.data);
  }

  update(procesoId: number, id: number, actividad: ActividadRequest): Promise<Actividad> {
    return api.put<Actividad>(`${this.url(procesoId)}/${id}`, actividad).then(r => r.data);
  }

  mover(
    procesoId: number,
    id: number,
    posicionX: number,
    posicionY: number
  ): Promise<Actividad> {
    return api
      .post<Actividad>(`${this.url(procesoId)}/${id}/mover`, null, {
        params: { posicionX, posicionY }
      })
      .then(r => r.data);
  }

  delete(procesoId: number, id: number): Promise<void> {
    return api.delete(`${this.url(procesoId)}/${id}`).then(() => undefined);
  }
}
