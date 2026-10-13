import { isAxiosError } from 'axios';

// Formato de error del GlobalExceptionHandler
interface CuerpoErrorBackend {
  timestamp?: string;
  status?: number;
  mensaje?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }
}

function esCuerpoError(valor: unknown): valor is CuerpoErrorBackend {
  return typeof valor === 'object' && valor !== null && 'mensaje' in valor;
}

export function aApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isAxiosError(error)) {
    if (!error.response) {
      return new ApiError(0, 'No hay conexión con el servidor. Verifica que el backend esté arriba.');
    }
    const { status, data } = error.response;
    if (esCuerpoError(data) && data.mensaje) {
      return new ApiError(status, data.mensaje);
    }
    if (status === 401) {
      return new ApiError(status, 'Correo o contraseña incorrectos.');
    }
    if (status === 403) {
      return new ApiError(status, 'No tienes permiso para realizar esta acción.');
    }
    if (status === 404) {
      return new ApiError(status, 'El recurso solicitado no existe.');
    }
    return new ApiError(status, 'Ocurrió un error inesperado. Intenta nuevamente.');
  }
  return new ApiError(0, error instanceof Error ? error.message : 'Error desconocido');
}

export function mensajeDeError(error: unknown): string {
  return aApiError(error).message;
}
