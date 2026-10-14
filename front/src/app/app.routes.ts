import { Routes } from '@angular/router';
import { autenticadoGuard, invitadoGuard, rolGuard } from './core/auth.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  // Públicas
  {
    // Quien ya tiene sesión pasa directo a /procesos (invitadoGuard)
    path: '',
    pathMatch: 'full',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    loadComponent: () =>
      import('./features/empresas/registro-empresa/registro-empresa').then((m) => m.RegistroEmpresa),
  },
  {
    path: 'activar-cuenta',
    loadComponent: () =>
      import('./features/auth/activar-cuenta/activar-cuenta').then((m) => m.ActivarCuenta),
  },

  // Requieren sesión
  {
    path: '',
    component: Shell,
    canActivate: [autenticadoGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'procesos' },
      {
        path: 'procesos',
        loadComponent: () =>
          import('./features/procesos/lista-procesos/lista-procesos').then((m) => m.ListaProcesos),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/gestion-usuarios/gestion-usuarios').then((m) => m.GestionUsuarios),
      },
      {
        path: 'procesos/compartidos',
        loadComponent: () =>
          import('./features/pools/procesos-compartidos/procesos-compartidos').then(
            (m) => m.ProcesosCompartidos,
          ),
      },
      {
        path: 'procesos/:procesoId/pools',
        loadComponent: () =>
          import('./features/pools/pools-proceso/pools-proceso').then((m) => m.PoolsProceso),
      },
      {
        path: 'procesos/:procesoId/compartir',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/pools/compartir-proceso/compartir-proceso').then((m) => m.CompartirProceso),
      },
      {
        path: 'configuracion/permisos-pool',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/pools/permisos-pool/permisos-pool').then((m) => m.PermisosPoolPagina),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
