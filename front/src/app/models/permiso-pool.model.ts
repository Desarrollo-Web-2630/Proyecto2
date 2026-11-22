import { RolAcceso } from './usuario.model';

export interface PermisoPool {
  rolAcceso: RolAcceso;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}
