// Contrato de ActividadRequestDTO del backend (HU-08 / HU-09)
export interface ActividadRequest {
  nombre: string;
  tipoActividad: string;
  posicionX: number;
  posicionY: number;
  laneId: number;
}

// SUPUESTO: el backend acepta cualquier texto en tipoActividad (solo exige que no esté vacío).
// Este catálogo es el de tareas BPMN más comunes; si el equipo define otro, se cambia aquí.
export const TIPOS_ACTIVIDAD: readonly string[] = ['TAREA', 'TAREA_USUARIO', 'TAREA_SERVICIO', 'TAREA_MANUAL'];

export const ETIQUETA_TIPO_ACTIVIDAD: Record<string, string> = {
  TAREA: 'Tarea',
  TAREA_USUARIO: 'Tarea de usuario',
  TAREA_SERVICIO: 'Tarea de servicio',
  TAREA_MANUAL: 'Tarea manual',
};

export function etiquetaTipoActividad(tipo: string): string {
  return ETIQUETA_TIPO_ACTIVIDAD[tipo] ?? tipo;
}

// ArcoRespuestaDTO del backend. Aquí solo se lee, para advertir al eliminar una actividad (HU-10).
export interface ArcoVista {
  id: number;
  nombre: string | null;
  condicion: string | null;
  origenId: number | null;
  origenNombre: string | null;
  destinoId: number | null;
  destinoNombre: string | null;
  procesoId: number | null;
}
