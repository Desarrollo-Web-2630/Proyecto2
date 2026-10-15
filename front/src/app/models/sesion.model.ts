import { Usuario } from './usuario.model';

// Usuario autenticado y su empresa
export interface Sesion extends Usuario {
  empresaId: number;
}
