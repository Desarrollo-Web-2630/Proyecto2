// Espejo de ArcoRespuestaDTO
export interface Arco {
  id: number;
  nombre: string | null;
  condicion: string | null;
  origenId: number | null;
  origenNombre: string | null;
  destinoId: number | null;
  destinoNombre: string | null;
  procesoId: number | null;
}
