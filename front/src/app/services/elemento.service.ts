import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ElementoService {
  private readonly http = inject(HttpClient);

  mover(procesoId: number, id: number, x: number, y: number): Observable<void> {
    return this.http.patch<void>(`/v1/procesos/${procesoId}/elementos/${id}/posicion`, null, {
      params: { x, y }
    });
  }
}
