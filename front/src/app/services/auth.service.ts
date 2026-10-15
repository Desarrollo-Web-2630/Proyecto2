import { Injectable, inject } from '@angular/core';
import { api } from '../core/api';
import { Sesion } from '../models/sesion.model';
import { LoginRequest, Usuario } from '../models/usuario.model';
import { ActivarCuentaRequest, VerificacionResponse } from '../models/verificacion.model';
import { EmpresaService } from './empresa.service';
import { SesionService } from './sesion.service';
import { UsuarioService } from './usuario.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sesion = inject(SesionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly usuarioService = inject(UsuarioService);

  async login(datos: LoginRequest): Promise<Sesion> {
    const usuario = (await api.post<Usuario>('/v1/usuarios/login', datos)).data;
    const empresaId = await this.buscarEmpresa(usuario);
    const sesion: Sesion = { ...usuario, empresaId };
    this.sesion.iniciar(sesion);
    return sesion;
  }

  logout(): void {
    this.sesion.cerrar();
  }

  activarCuenta(datos: ActivarCuentaRequest): Promise<VerificacionResponse> {
    return api.post<VerificacionResponse>('/auth/activar-cuenta', datos).then(r => r.data);
  }

  reenviarVerificacion(correo: string): Promise<VerificacionResponse> {
    return api.post<VerificacionResponse>('/auth/reenviar-verificacion', { correo }).then(r => r.data);
  }

  // El login no devuelve la empresa, así que se busca al usuario en cada una
  private async buscarEmpresa(usuario: Usuario): Promise<number> {
    const empresas = await this.empresaService.list();
    for (const empresa of empresas) {
      const usuarios = await this.usuarioService.listDeEmpresa(empresa.id);
      if (usuarios.some(u => u.id === usuario.id)) {
        return empresa.id;
      }
    }
    throw new Error('No se encontró la empresa del usuario');
  }
}
