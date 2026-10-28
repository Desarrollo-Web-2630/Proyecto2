import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { invitadoGuard } from './core/invitado.guard';

export const routes: Routes = [
  {
    // Landing pública; quien ya tiene sesión pasa directo a /procesos
    path: '',
    pathMatch: 'full',
    title: 'Procesos',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./landing/landing').then(m => m.Landing)
  },
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'activar-cuenta',
    title: 'Activar cuenta',
    loadComponent: () => import('./auth/activar-cuenta/activar-cuenta.component').then(m => m.ActivarCuentaComponent)
  },
  {
    path: 'registro',
    title: 'Registrar empresa',
    loadComponent: () => import('./empresas/empresa-form/empresa-form.component').then(m => m.EmpresaFormComponent)
  },
  // Pantallas que requieren sesión
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'procesos', loadChildren: () => import('./procesos/procesos.routes').then(m => m.PROCESOS_ROUTES) },
      { path: 'usuarios', loadChildren: () => import('./usuarios/usuarios.routes').then(m => m.USUARIOS_ROUTES) },
      { path: 'roles', loadChildren: () => import('./roles/roles.routes').then(m => m.ROLES_ROUTES) }
    ]
  },
  { path: '**', redirectTo: '' }
];
