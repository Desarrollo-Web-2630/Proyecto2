import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { Proceso, ProcesoFiltro, ProcesoRequest } from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/procesos';

  list(incluirInactivos = false): Observable<Proceso[]> {
    return this.http.get<Proceso[]>(this.url, { params: { incluirInactivos } });
  }

  buscar(filtro: ProcesoFiltro): Observable<Page<Proceso>> {
    let params = new HttpParams()
      .set('incluirInactivos', filtro.incluirInactivos ?? false)
      .set('page', filtro.page ?? 0)
      .set('size', filtro.size ?? 10);
    if (filtro.nombre) {
      params = params.set('nombre', filtro.nombre);
    }
    if (filtro.estado) {
      params = params.set('estado', filtro.estado);
    }
    if (filtro.categoria) {
      params = params.set('categoria', filtro.categoria);
    }
    return this.http.get<Page<Proceso>>(`${this.url}/buscar`, { params });
  }

  get(id: number): Observable<Proceso> {
    return this.http.get<Proceso>(`${this.url}/${id}`);
  }

  create(proceso: ProcesoRequest): Observable<Proceso> {
    return this.http.post<Proceso>(this.url, proceso);
  }

  update(id: number, proceso: ProcesoRequest): Observable<Proceso> {
    return this.http.put<Proceso>(`${this.url}/${id}`, proceso);
  }

  publicar(id: number): Observable<Proceso> {
    return this.http.post<Proceso>(`${this.url}/${id}/publicar`, null);
  }

  inactivar(id: number): Observable<Proceso> {
    return this.http.post<Proceso>(`${this.url}/${id}/inactivar`, null);
  }

  reactivar(id: number): Observable<Proceso> {
    return this.http.post<Proceso>(`${this.url}/${id}/reactivar`, null);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
