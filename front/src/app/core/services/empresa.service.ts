import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { Empresa, EmpresaRequest } from '../models/empresa.model';

// HU-01
@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly api = inject(ApiClient);
  private readonly base = '/v1/empresas';

  registrar(datos: EmpresaRequest): Promise<Empresa> {
    return this.api.post<Empresa, EmpresaRequest>(this.base, datos);
  }

  listar(): Promise<Empresa[]> {
    return this.api.get<Empresa[]>(this.base);
  }

  obtener(id: number): Promise<Empresa> {
    return this.api.get<Empresa>(`${this.base}/${id}`);
  }
}
