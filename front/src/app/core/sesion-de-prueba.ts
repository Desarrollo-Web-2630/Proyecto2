import { Sesion } from '../models/sesion.model';
import { RolAcceso } from '../models/usuario.model';

// Sesión falsa para las pruebas unitarias; vence en `msParaVencer` milisegundos
export function sesionDePrueba(rol: RolAcceso, msParaVencer = 60_000): Sesion {
  return {
    token: 'token-de-prueba',
    expira: Date.now() + msParaVencer,
    usuario: { id: 1, nombre: 'Prueba', correo: 'prueba@demo.com', rolAcceso: rol, activo: true, empresaId: 1 }
  };
}
