// Espejo de EmpresaRespuestaDTO
export interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  correo: string;
}

// Espejo de EmpresaDTO
export type EmpresaRequest = Omit<Empresa, 'id'>;
