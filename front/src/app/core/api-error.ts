import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../models/error-response.model';

export function mensajeDeError(err: unknown, porDefecto: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return porDefecto;
  }
  if (err.status === 0) {
    return 'No hay conexión con el servidor. Verifica que el backend esté en ejecución.';
  }
  if (err.status >= 500) {
    return 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.';
  }
  const cuerpo = err.error as Partial<ErrorResponse> | null;
  return cuerpo?.mensaje ?? porDefecto;
}
