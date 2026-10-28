import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { RolProceso, RolProcesoRequest } from '../models/rol-proceso.model';

@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/roles-proceso';

  list(): Observable<RolProceso[]> {
    return this.http.get<RolProceso[]>(this.url);
  }

  buscar(nombre: string, page: number, size: number): Observable<Page<RolProceso>> {
    return this.http.get<Page<RolProceso>>(`${this.url}/buscar`, { params: { nombre, page, size } });
  }

  get(id: number): Observable<RolProceso> {
    return this.http.get<RolProceso>(`${this.url}/${id}`);
  }

  create(rol: RolProcesoRequest): Observable<RolProceso> {
    return this.http.post<RolProceso>(this.url, rol);
  }

  update(id: number, rol: RolProcesoRequest): Observable<RolProceso> {
    return this.http.put<RolProceso>(`${this.url}/${id}`, rol);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
