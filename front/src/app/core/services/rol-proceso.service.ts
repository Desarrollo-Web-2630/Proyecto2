import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { RolProceso } from '../models/pool.model';

@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly api = inject(ApiClient);

  listar(): Promise<RolProceso[]> {
    return this.api.get<RolProceso[]>('/v1/roles-proceso');
  }
}
