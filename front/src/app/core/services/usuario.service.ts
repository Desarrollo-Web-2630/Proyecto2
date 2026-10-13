import { Injectable, inject } from '@angular/core';
import { ApiClient, ENCABEZADO_EMPRESA } from '../api-client';
import { RolAcceso, UsuarioRequest, UsuarioVista } from '../models/usuario.model';

// HU-02
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly api = inject(ApiClient);
  private readonly base = '/v1/usuarios';

  listar(): Promise<UsuarioVista[]> {
    return this.api.get<UsuarioVista[]>(this.base);
  }

  // Solo para ubicar la empresa al iniciar sesión
  listarDeEmpresa(empresaId: number): Promise<UsuarioVista[]> {
    return this.api.get<UsuarioVista[]>(this.base, { headers: { [ENCABEZADO_EMPRESA]: String(empresaId) } });
  }

  invitar(datos: UsuarioRequest): Promise<UsuarioVista> {
    return this.api.post<UsuarioVista, UsuarioRequest>(this.base, datos);
  }

  // El backend recibe el rol como query param
  cambiarRol(id: number, rolAcceso: RolAcceso): Promise<UsuarioVista> {
    return this.api.post<UsuarioVista>(`${this.base}/${id}/rol`, undefined, { params: { rolAcceso } });
  }

  desactivar(id: number): Promise<UsuarioVista> {
    return this.api.post<UsuarioVista>(`${this.base}/${id}/desactivar`);
  }
}
