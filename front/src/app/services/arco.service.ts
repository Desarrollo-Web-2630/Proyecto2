import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Arco } from '../models/arco.model';

@Injectable({ providedIn: 'root' })
export class ArcoService {
  list(procesoId: number): Promise<Arco[]> {
    return api.get<Arco[]>(`/v1/procesos/${procesoId}/arcos`).then(r => r.data);
  }
}
