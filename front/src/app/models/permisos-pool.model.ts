import { RolAcceso } from './usuario.model';

// Roles de acceso permitidos por acción
export interface PermisosPool {
  crear: RolAcceso[];
  editar: RolAcceso[];
  eliminar: RolAcceso[];
}
