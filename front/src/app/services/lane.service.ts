import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Lane, LaneRequest } from '../models/lane.model';

@Injectable({ providedIn: 'root' })
export class LaneService {
  private url(procesoId: number, poolId: number): string {
    return `/v1/procesos/${procesoId}/pools/${poolId}/lanes`;
  }

  list(procesoId: number, poolId: number): Promise<Lane[]> {
    return api.get<Lane[]>(this.url(procesoId, poolId)).then(r => r.data);
  }

  create(procesoId: number, poolId: number, lane: LaneRequest): Promise<Lane> {
    return api.post<Lane>(this.url(procesoId, poolId), lane).then(r => r.data);
  }

  update(procesoId: number, poolId: number, id: number, lane: LaneRequest): Promise<Lane> {
    return api.put<Lane>(`${this.url(procesoId, poolId)}/${id}`, lane).then(r => r.data);
  }

  // Recibe los ids en el nuevo orden, de arriba hacia abajo
  ordenar(procesoId: number, poolId: number, lanesIds: number[]): Promise<Lane[]> {
    return api.put<Lane[]>(`${this.url(procesoId, poolId)}/orden`, { lanesIds }).then(r => r.data);
  }

  delete(procesoId: number, poolId: number, id: number): Promise<void> {
    return api.delete(`${this.url(procesoId, poolId)}/${id}`).then(() => undefined);
  }
}
