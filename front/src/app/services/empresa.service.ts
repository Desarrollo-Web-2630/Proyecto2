import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { Empresa, EmpresaRequest } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly url = '/v1/empresas';

  list(): Promise<Empresa[]> {
    return api.get<Empresa[]>(this.url).then(r => r.data);
  }

  get(id: number): Promise<Empresa> {
    return api.get<Empresa>(`${this.url}/${id}`).then(r => r.data);
  }

  create(empresa: EmpresaRequest): Promise<Empresa> {
    return api.post<Empresa>(this.url, empresa).then(r => r.data);
  }
}
