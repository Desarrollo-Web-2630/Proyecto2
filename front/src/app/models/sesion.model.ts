import { RolAcceso, Usuario } from './usuario.model';

// Espejo de LoginResponseDTO: lo que devuelve POST /api/v1/usuarios/login
export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

// Claims que el backend firma dentro del JWT. El front solo los lee para la interfaz;
// quien decide el acceso es siempre el backend al validar la firma.
export interface JwtPayload {
  sub: string;       // correo del usuario
  uid: number;       // id del usuario
  empresaId: number;
  rol: RolAcceso;
  iat: number;       // emitido (segundos epoch)
  exp: number;       // expira (segundos epoch)
}

// Lo que se guarda en sessionStorage mientras dura la sesión
export interface Sesion {
  token: string;
  usuario: Usuario;
  expiraEn: number;  // milisegundos epoch, tomado del claim exp
}
