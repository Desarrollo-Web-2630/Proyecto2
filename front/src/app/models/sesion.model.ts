import { Usuario } from './usuario.model';

// Lo que se guarda en sessionStorage al iniciar sesión
export interface Sesion {
  token: string;
  expira: number;
  usuario: Usuario;
}
