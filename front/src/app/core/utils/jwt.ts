import { JwtPayload } from '../../models/sesion.model';

// Lee el payload de un JWT sin verificar la firma: el front no tiene (ni debe tener) la clave.
// Solo sirve para saber cuándo expira el token y mostrar la interfaz correcta.
export function leerPayload(token: string): JwtPayload | null {
  const partes = token.split('.');
  if (partes.length !== 3) {
    return null;
  }
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const bytes = Uint8Array.from(atob(relleno), c => c.charCodeAt(0));
    const payload: Partial<JwtPayload> = JSON.parse(new TextDecoder().decode(bytes));
    return typeof payload.exp === 'number' ? (payload as JwtPayload) : null;
  } catch {
    return null;
  }
}
