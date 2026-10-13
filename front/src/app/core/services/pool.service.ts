import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { Lane, LaneRequest, Pool, PoolRequest } from '../models/pool.model';

// HU-21 y HU-22
@Injectable({ providedIn: 'root' })
export class PoolService {
  private readonly api = inject(ApiClient);

  private pools(procesoId: number): string {
    return `/v1/procesos/${procesoId}/pools`;
  }

  private lanes(procesoId: number, poolId: number): string {
    return `${this.pools(procesoId)}/${poolId}/lanes`;
  }

  listar(procesoId: number): Promise<Pool[]> {
    return this.api.get<Pool[]>(this.pools(procesoId));
  }

  crear(procesoId: number, datos: PoolRequest): Promise<Pool> {
    return this.api.post<Pool, PoolRequest>(this.pools(procesoId), datos);
  }

  actualizar(procesoId: number, poolId: number, datos: PoolRequest): Promise<Pool> {
    return this.api.put<Pool, PoolRequest>(`${this.pools(procesoId)}/${poolId}`, datos);
  }

  eliminar(procesoId: number, poolId: number): Promise<void> {
    return this.api.delete(`${this.pools(procesoId)}/${poolId}`);
  }

  listarLanes(procesoId: number, poolId: number): Promise<Lane[]> {
    return this.api.get<Lane[]>(this.lanes(procesoId, poolId));
  }

  crearLane(procesoId: number, poolId: number, datos: LaneRequest): Promise<Lane> {
    return this.api.post<Lane, LaneRequest>(this.lanes(procesoId, poolId), datos);
  }

  actualizarLane(procesoId: number, poolId: number, laneId: number, datos: LaneRequest): Promise<Lane> {
    return this.api.put<Lane, LaneRequest>(`${this.lanes(procesoId, poolId)}/${laneId}`, datos);
  }

  reordenarLanes(procesoId: number, poolId: number, lanesIds: number[]): Promise<Lane[]> {
    return this.api.put<Lane[], { lanesIds: number[] }>(`${this.lanes(procesoId, poolId)}/orden`, {
      lanesIds,
    });
  }

  eliminarLane(procesoId: number, poolId: number, laneId: number): Promise<void> {
    return this.api.delete(`${this.lanes(procesoId, poolId)}/${laneId}`);
  }
}
