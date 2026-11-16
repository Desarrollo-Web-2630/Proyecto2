import { Usuario } from './usuario.model';

// Espejo de LoginRespuestaDTO
export interface LoginRespuesta {
  token: string;
  tipo: string;
  expiraEn: number;
  usuario: Usuario;
}
