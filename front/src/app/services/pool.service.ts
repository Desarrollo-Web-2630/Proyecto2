import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Pool, PoolRequest } from '../models/pool.model';

@Injectable({ providedIn: 'root' })
export class PoolService {
  private url(procesoId: number): string {
    return `/v1/procesos/${procesoId}/pools`;
  }

  list(procesoId: number): Promise<Pool[]> {
    return api.get<Pool[]>(this.url(procesoId)).then(r => r.data);
  }

  create(procesoId: number, pool: PoolRequest): Promise<Pool> {
    return api.post<Pool>(this.url(procesoId), pool).then(r => r.data);
  }

  update(procesoId: number, id: number, pool: PoolRequest): Promise<Pool> {
    return api.put<Pool>(`${this.url(procesoId)}/${id}`, pool).then(r => r.data);
  }

  delete(procesoId: number, id: number): Promise<void> {
    return api.delete(`${this.url(procesoId)}/${id}`).then(() => undefined);
  }
}
