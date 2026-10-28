export type RolAcceso = 'ADMIN' | 'EDITOR' | 'LECTURA';

// Espejo de UsuarioVistaDTO
export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rolAcceso: RolAcceso;
  activo: boolean;
  empresaId: number;
}

// Espejo de UsuarioDTO
export interface UsuarioRequest {
  nombre: string;
  correo: string;
  password: string;
  rolAcceso: RolAcceso;
}

// Espejo de LoginDTO
export interface LoginRequest {
  correo: string;
  password: string;
}
