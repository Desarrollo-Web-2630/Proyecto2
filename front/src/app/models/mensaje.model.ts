export type TipoMensaje = 'THROW' | 'CATCH';
export type VarianteMensaje = 'INICIO' | 'INTERMEDIO';
export type PoliticaFallo = 'REINTENTAR' | 'FALLAR' | 'REGISTRAR';

export interface Mensaje {
  id: number;
  nombre: string;
  claveCorrelacion: string;
  procesoId: number;
  poolOrigenId: number;
  poolDestinoId: number;
  elementoOrigenId: number | null;
  tipoMensaje?: TipoMensaje;
  variante?: VarianteMensaje;
  destinoExterno?: string | null;
  payload?: string | null;
  politicaFallo?: PoliticaFallo | null;
}

export type MensajeRequest = Omit<Mensaje, 'id' | 'procesoId'>;
