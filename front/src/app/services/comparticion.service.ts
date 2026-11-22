import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Comparticion, ComparticionRequest, EmpresaResumen } from '../models/comparticion.model';

@Injectable({ providedIn: 'root' })
export class ComparticionService {
  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/v1/procesos/${procesoId}/comparticion`;
  }

  catalogo(): Observable<EmpresaResumen[]> {
    return this.http.get<EmpresaResumen[]>('/v1/empresas/catalogo');
  }

  get(procesoId: number): Observable<Comparticion> {
    return this.http.get<Comparticion>(this.url(procesoId));
  }

  guardar(procesoId: number, empresasInvitadasIds: number[]): Observable<Comparticion> {
    const datos: ComparticionRequest = { empresasInvitadasIds };
    return this.http.put<Comparticion>(this.url(procesoId), datos);
  }
}
