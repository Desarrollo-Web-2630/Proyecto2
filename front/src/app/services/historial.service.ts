import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HistorialCambio } from '../models/historial.model';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/historial';

  list(): Observable<HistorialCambio[]> {
    return this.http.get<HistorialCambio[]>(this.url);
  }

  porProceso(procesoId: number): Observable<HistorialCambio[]> {
    return this.http.get<HistorialCambio[]>(`/v1/procesos/${procesoId}/historial`);
  }
}
