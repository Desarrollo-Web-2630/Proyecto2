export interface EmpresaResumen {
  id: number;
  nombre: string;
}

export interface Comparticion {
  procesoId: number;
  compartido: boolean;
  empresasInvitadas: EmpresaResumen[];
}

export interface ComparticionRequest {
  empresasInvitadasIds: number[];
}
