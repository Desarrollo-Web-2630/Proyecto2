// Rol de acceso (HU-02), distinto del rol de proceso (HU-17)
export type RolAcceso = 'ADMIN' | 'EDITOR' | 'LECTURA';

export const ROLES_ACCESO: readonly RolAcceso[] = ['ADMIN', 'EDITOR', 'LECTURA'];

export const ETIQUETA_ROL_ACCESO: Record<RolAcceso, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  LECTURA: 'Solo lectura',
};

export interface UsuarioVista {
  id: number;
  nombre: string;
  correo: string;
  rolAcceso: RolAcceso;
  activo: boolean;
}

// Usuario en sesión
export interface Usuario extends UsuarioVista {
  empresaId: number;
}

export interface UsuarioRequest {
  nombre: string;
  correo: string;
  password: string;
  rolAcceso: RolAcceso;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface ActivarCuentaRequest {
  token: string;
  nuevaPassword: string;
}

export interface VerificacionCorreoResponse {
  verificado: boolean;
  mensaje: string;
  correo: string;
}
