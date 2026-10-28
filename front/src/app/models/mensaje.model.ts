// Espejo de MensajeRespuestaDTO
export interface Mensaje {
  id: number;
  nombre: string;
  claveCorrelacion: string;
  procesoId: number;
  poolOrigenId: number;
  poolDestinoId: number;
  elementoOrigenId: number | null;
}

export type MensajeRequest = Omit<Mensaje, 'id' | 'procesoId'>;
