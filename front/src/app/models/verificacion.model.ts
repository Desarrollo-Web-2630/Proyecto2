// Espejo de ActivarCuentaRequestDTO
export interface ActivarCuentaRequest {
  token: string;
  nuevaPassword: string;
}

// Espejo de VerificacionCorreoResponseDTO
export interface VerificacionResponse {
  verificado: boolean;
  mensaje: string;
  correo: string;
}
