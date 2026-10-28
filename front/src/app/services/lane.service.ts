import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Lane, LaneRequest } from '../models/lane.model';

@Injectable({ providedIn: 'root' })
export class LaneService {
  private readonly http = inject(HttpClient);

  private url(procesoId: number, poolId: number): string {
    return `/v1/procesos/${procesoId}/pools/${poolId}/lanes`;
  }

  list(procesoId: number, poolId: number): Observable<Lane[]> {
    return this.http.get<Lane[]>(this.url(procesoId, poolId));
  }

  create(procesoId: number, poolId: number, lane: LaneRequest): Observable<Lane> {
    return this.http.post<Lane>(this.url(procesoId, poolId), lane);
  }

  update(procesoId: number, poolId: number, id: number, lane: LaneRequest): Observable<Lane> {
    return this.http.put<Lane>(`${this.url(procesoId, poolId)}/${id}`, lane);
  }

  ordenar(procesoId: number, poolId: number, lanesIds: number[]): Observable<Lane[]> {
    return this.http.put<Lane[]>(`${this.url(procesoId, poolId)}/orden`, { lanesIds });
  }

  delete(procesoId: number, poolId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId, poolId)}/${id}`);
  }
}
