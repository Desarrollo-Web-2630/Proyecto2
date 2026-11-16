import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Capacidad {
  titulo: string;
  texto: string;
}

// Página pública de entrada. Quien ya tiene sesión nunca la ve: invitadoGuard lo manda a /procesos.
@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  protected readonly anio = new Date().getFullYear();

  protected readonly capacidades: readonly Capacidad[] = [
    {
      titulo: 'Modela tu proceso completo',
      texto: 'Actividades, arcos, gateways, pools, lanes y mensajes en un mismo diagrama de notación tipo BPMN.',
    },
    {
      titulo: 'Responsables por función',
      texto: 'Cada actividad vive en una lane que representa un rol de proceso, no una persona. Si alguien se va, el proceso sigue.',
    },
    {
      titulo: 'Un espacio por empresa',
      texto: 'Tus procesos, usuarios y roles están aislados. Solo compartes un proceso si decides hacerlo, y siempre en solo lectura.',
    },
    {
      titulo: 'Permisos por rol de acceso',
      texto: 'Administrador, editor y solo lectura: cada usuario ve y hace únicamente lo que le corresponde.',
    },
    {
      titulo: 'Nada se pierde',
      texto: 'Las eliminaciones son lógicas: el diagrama se conserva para auditoría y trazabilidad.',
    },
    {
      titulo: 'Coherencia validada',
      texto: 'El editor advierte de elementos desconectados, arcos que cruzan pools o roles que siguen en uso.',
    },
  ];

  protected readonly pasos: readonly Capacidad[] = [
    { titulo: 'Registra tu empresa', texto: 'Con el NIT y un correo se crea tu espacio y el administrador inicial.' },
    { titulo: 'Invita a tu equipo', texto: 'Asigna rol de acceso y activa cada cuenta con el enlace del correo.' },
    { titulo: 'Dibuja tus procesos', texto: 'Crea pools, lanes y actividades, y conéctalos con arcos y gateways.' },
  ];
}
