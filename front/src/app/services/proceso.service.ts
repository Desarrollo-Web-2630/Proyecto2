import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Proceso } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly url = '/v1/procesos';

  list(): Promise<Proceso[]> {
    return api.get<Proceso[]>(this.url).then(r => r.data);
  }

  get(id: number): Promise<Proceso> {
    return api.get<Proceso>(`${this.url}/${id}`).then(r => r.data);
  }
}
