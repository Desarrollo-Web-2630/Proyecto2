import { RolAcceso } from './usuario.model';

// Roles de acceso que pueden crear, editar o eliminar pools y lanes
export interface PermisosPool {
  crear: RolAcceso[];
  editar: RolAcceso[];
  eliminar: RolAcceso[];
}
