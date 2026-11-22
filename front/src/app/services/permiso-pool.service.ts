import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PermisoPool } from '../models/permiso-pool.model';

@Injectable({ providedIn: 'root' })
export class PermisoPoolService {
  private readonly http = inject(HttpClient);

  private url(procesoId: number, poolId: number): string {
    return `/v1/procesos/${procesoId}/pools/${poolId}/permisos`;
  }

  list(procesoId: number, poolId: number): Observable<PermisoPool[]> {
    return this.http.get<PermisoPool[]>(this.url(procesoId, poolId));
  }

  update(procesoId: number, poolId: number, permiso: PermisoPool): Observable<PermisoPool> {
    return this.http.put<PermisoPool>(this.url(procesoId, poolId), permiso);
  }
}
