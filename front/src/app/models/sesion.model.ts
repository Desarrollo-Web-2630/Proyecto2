import { Usuario } from './usuario.model';

// Usuario autenticado junto con la empresa a la que pertenece
export interface Sesion extends Usuario {
  empresaId: number;
}
