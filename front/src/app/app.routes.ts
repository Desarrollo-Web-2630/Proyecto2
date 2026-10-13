import { Routes } from '@angular/router';
import { autenticadoGuard, invitadoGuard, rolGuard } from './core/auth.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  // Públicas
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./historiasusuario/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    loadComponent: () =>
      import('./historiasusuario/empresas/registro-empresa/registro-empresa').then((m) => m.RegistroEmpresa),
  },
  {
    path: 'activar-cuenta',
    loadComponent: () =>
      import('./historiasusuario/auth/activar-cuenta/activar-cuenta').then((m) => m.ActivarCuenta),
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
          import('./historiasusuario/procesos/lista-procesos/lista-procesos').then((m) => m.ListaProcesos),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./historiasusuario/usuarios/gestion-usuarios/gestion-usuarios').then((m) => m.GestionUsuarios),
      },
      {
        path: 'procesos/compartidos',
        loadComponent: () =>
          import('./historiasusuario/pools/procesos-compartidos/procesos-compartidos').then(
            (m) => m.ProcesosCompartidos,
          ),
      },
      {
        path: 'procesos/:procesoId/pools',
        loadComponent: () =>
          import('./historiasusuario/pools/pools-proceso/pools-proceso').then((m) => m.PoolsProceso),
      },
      {
        path: 'procesos/:procesoId/compartir',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () =>
          import('./historiasusuario/pools/compartir-proceso/compartir-proceso').then((m) => m.CompartirProceso),
      },
      {
        path: 'configuracion/permisos-pool',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () =>
          import('./historiasusuario/pools/permisos-pool/permisos-pool').then((m) => m.PermisosPoolPagina),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
