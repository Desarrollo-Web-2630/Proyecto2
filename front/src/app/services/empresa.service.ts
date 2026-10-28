import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Empresa, EmpresaRequest } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/empresas';

  list(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.url);
  }

  get(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.url}/${id}`);
  }

  create(empresa: EmpresaRequest): Observable<Empresa> {
    return this.http.post<Empresa>(this.url, empresa);
  }
}
