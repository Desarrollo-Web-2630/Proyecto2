import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/guards/auth.guard';
import { invitadoGuard } from './core/guards/invitado.guard';

export const routes: Routes = [
  {
    // Landing pública; quien ya tiene sesión pasa directo a /procesos
    path: '',
    pathMatch: 'full',
    title: 'Procesos',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/publico/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    title: 'Iniciar sesión',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'activar-cuenta',
    title: 'Activar cuenta',
    loadComponent: () => import('./pages/auth/activar-cuenta/activar-cuenta.component').then(m => m.ActivarCuentaComponent)
  },
  {
    path: 'registro',
    title: 'Registrar empresa',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/empresas/empresa-form/empresa-form.component').then(m => m.EmpresaFormComponent)
  },
  // Pantallas que requieren sesión: authGuard protege el layout y todas sus hijas
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: 'procesos', loadChildren: () => import('./routes/procesos.routes').then(m => m.PROCESOS_ROUTES) },
      { path: 'usuarios', loadChildren: () => import('./routes/usuarios.routes').then(m => m.USUARIOS_ROUTES) },
      { path: 'roles', loadChildren: () => import('./routes/roles.routes').then(m => m.ROLES_ROUTES) },
      {
        path: 'acceso-denegado',
        title: 'Acceso denegado',
        loadComponent: () => import('./pages/errores/acceso-denegado/acceso-denegado.component').then(m => m.AccesoDenegadoComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
