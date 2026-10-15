import { isAxiosError } from 'axios';
import { ErrorResponse } from '../models/error-response.model';

// Traduce un error de la API a un mensaje para el usuario, sin detalles técnicos
export function mensajeDeError(err: unknown, porDefecto: string): string {
  if (!isAxiosError(err)) {
    return porDefecto;
  }
  if (!err.response) {
    return 'No hay conexión con el servidor. Verifica que el backend esté en ejecución.';
  }
  if (err.response.status >= 500) {
    return 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.';
  }
  const cuerpo = err.response.data as Partial<ErrorResponse> | null;
  return cuerpo?.mensaje ?? porDefecto;
}
