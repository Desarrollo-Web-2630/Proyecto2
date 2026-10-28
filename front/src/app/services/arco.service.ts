import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Arco, ArcoEliminado, ArcoRequest } from '../models/arco.model';

@Injectable({ providedIn: 'root' })
export class ArcoService {
  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/v1/procesos/${procesoId}/arcos`;
  }

  list(procesoId: number): Observable<Arco[]> {
    return this.http.get<Arco[]>(this.url(procesoId));
  }

  create(procesoId: number, arco: ArcoRequest): Observable<Arco> {
    return this.http.post<Arco>(this.url(procesoId), arco);
  }

  update(procesoId: number, id: number, arco: ArcoRequest): Observable<Arco> {
    return this.http.put<Arco>(`${this.url(procesoId)}/${id}`, arco);
  }

  delete(procesoId: number, id: number): Observable<ArcoEliminado> {
    return this.http.delete<ArcoEliminado>(`${this.url(procesoId)}/${id}`);
  }
}
