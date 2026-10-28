import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pool, PoolRequest } from '../models/pool.model';

@Injectable({ providedIn: 'root' })
export class PoolService {
  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/v1/procesos/${procesoId}/pools`;
  }

  list(procesoId: number): Observable<Pool[]> {
    return this.http.get<Pool[]>(this.url(procesoId));
  }

  create(procesoId: number, pool: PoolRequest): Observable<Pool> {
    return this.http.post<Pool>(this.url(procesoId), pool);
  }

  update(procesoId: number, id: number, pool: PoolRequest): Observable<Pool> {
    return this.http.put<Pool>(`${this.url(procesoId)}/${id}`, pool);
  }

  delete(procesoId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId)}/${id}`);
  }
}
