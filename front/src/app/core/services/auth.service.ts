import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../api-client';
import { ApiError } from '../api-error';
import {
  ActivarCuentaRequest,
  LoginRequest,
  Usuario,
  UsuarioVista,
  VerificacionCorreoResponse,
} from '../models/usuario.model';
import { EmpresaService } from './empresa.service';
import { SesionService } from './sesion.service';
import { UsuarioService } from './usuario.service';

// HU-03
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly sesion = inject(SesionService);
  private readonly empresas = inject(EmpresaService);
  private readonly usuarios = inject(UsuarioService);

  async login(datos: LoginRequest): Promise<Usuario> {
    const vista = await this.api.post<UsuarioVista & { empresaId?: number }, LoginRequest>(
      '/v1/usuarios/login',
      { correo: datos.correo.trim().toLowerCase(), password: datos.password },
    );
    const empresaId = vista.empresaId ?? (await this.resolverEmpresa(vista));
    const usuario: Usuario = { ...vista, empresaId };
    this.sesion.iniciar(usuario);
    return usuario;
  }

  private async resolverEmpresa(usuario: UsuarioVista): Promise<number> {
    const empresas = await this.empresas.listar();
    const encontradas = await Promise.all(
      empresas.map(async (e) => {
        const lista = await this.usuarios.listarDeEmpresa(e.id);
        return lista.some((u) => u.id === usuario.id && u.correo === usuario.correo) ? e.id : null;
      }),
    );
    const empresaId = encontradas.find((id): id is number => id !== null);
    if (empresaId === undefined) {
      throw new ApiError(500, 'No se encontró la empresa del usuario.');
    }
    return empresaId;
  }

  logout(): void {
    this.sesion.cerrar();
  }

  activarCuenta(datos: ActivarCuentaRequest): Promise<VerificacionCorreoResponse> {
    return this.api.post<VerificacionCorreoResponse, ActivarCuentaRequest>('/auth/activar-cuenta', datos);
  }

  reenviarVerificacion(correo: string): Promise<VerificacionCorreoResponse> {
    return this.api.post<VerificacionCorreoResponse>('/auth/reenviar-verificacion', { correo });
  }
}
