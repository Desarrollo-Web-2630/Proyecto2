import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Gateway, GatewayRequest } from '../models/gateway.model';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/v1/procesos/${procesoId}/gateways`;
  }

  list(procesoId: number): Observable<Gateway[]> {
    return this.http.get<Gateway[]>(this.url(procesoId));
  }

  create(procesoId: number, gateway: GatewayRequest): Observable<Gateway> {
    return this.http.post<Gateway>(this.url(procesoId), gateway);
  }

  update(procesoId: number, id: number, gateway: GatewayRequest): Observable<Gateway> {
    return this.http.put<Gateway>(`${this.url(procesoId)}/${id}`, gateway);
  }

  delete(procesoId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId)}/${id}`);
  }
}
