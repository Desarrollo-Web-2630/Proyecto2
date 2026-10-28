import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Mensaje, MensajeRequest } from '../models/mensaje.model';

@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/v1/procesos/${procesoId}/mensajes`;
  }

  list(procesoId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(this.url(procesoId));
  }

  create(procesoId: number, mensaje: MensajeRequest): Observable<Mensaje> {
    return this.http.post<Mensaje>(this.url(procesoId), mensaje);
  }

  update(procesoId: number, id: number, mensaje: MensajeRequest): Observable<Mensaje> {
    return this.http.put<Mensaje>(`${this.url(procesoId)}/${id}`, mensaje);
  }

  delete(procesoId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId)}/${id}`);
  }
}
