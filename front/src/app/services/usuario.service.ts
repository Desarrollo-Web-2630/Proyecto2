import { Injectable } from '@angular/core';
import { api } from '../core/api';
import { RolAcceso, Usuario, UsuarioRequest } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly url = '/v1/usuarios';

  list(): Promise<Usuario[]> {
    return api.get<Usuario[]>(this.url).then(r => r.data);
  }

  listDeEmpresa(empresaId: number): Promise<Usuario[]> {
    return api.get<Usuario[]>(this.url, { headers: { 'X-Empresa-Id': String(empresaId) } }).then(r => r.data);
  }

  create(usuario: UsuarioRequest): Promise<Usuario> {
    return api.post<Usuario>(this.url, usuario).then(r => r.data);
  }

  cambiarRol(id: number, rolAcceso: RolAcceso): Promise<Usuario> {
    return api.post<Usuario>(`${this.url}/${id}/rol`, null, { params: { rolAcceso } }).then(r => r.data);
  }

  desactivar(id: number): Promise<Usuario> {
    return api.post<Usuario>(`${this.url}/${id}/desactivar`).then(r => r.data);
  }
}
