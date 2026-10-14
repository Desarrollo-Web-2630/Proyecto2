import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { ArcoVista } from '../models/actividad.model';

// Por ahora solo lectura: lo usa HU-10 para calcular qué queda desconectado.
// Quien haga el front de HU-11 a HU-13 puede ampliar este servicio (crear, editar, eliminar).
@Injectable({ providedIn: 'root' })
export class ArcoService {
  private readonly api = inject(ApiClient);

  listar(procesoId: number): Promise<ArcoVista[]> {
    return this.api.get<ArcoVista[]>(`/v1/procesos/${procesoId}/arcos`);
  }
}
