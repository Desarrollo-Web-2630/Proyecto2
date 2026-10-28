import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { Actividad, ActividadRequest } from '../models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/v1/procesos/${procesoId}/actividades`;
  }

  list(procesoId: number): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(this.url(procesoId));
  }

  buscar(procesoId: number, page: number, size: number): Observable<Page<Actividad>> {
    return this.http.get<Page<Actividad>>(`${this.url(procesoId)}/buscar`, { params: { page, size } });
  }

  get(procesoId: number, id: number): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.url(procesoId)}/${id}`);
  }

  create(procesoId: number, actividad: ActividadRequest): Observable<Actividad> {
    return this.http.post<Actividad>(this.url(procesoId), actividad);
  }

  update(procesoId: number, id: number, actividad: ActividadRequest): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.url(procesoId)}/${id}`, actividad);
  }

  mover(procesoId: number, id: number, posicionX: number, posicionY: number): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.url(procesoId)}/${id}/mover`, null, {
      params: { posicionX, posicionY }
    });
  }

  delete(procesoId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId)}/${id}`);
  }
}
