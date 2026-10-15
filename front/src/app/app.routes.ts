import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Procesos',
    loadComponent: () => import('./inicio/inicio.component').then(m => m.InicioComponent)
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
      { path: 'roles', loadChildren: () => import('./roles/roles.routes').then(m => m.ROLES_ROUTES) },
      {
        path: 'permisos-pool',
        title: 'Permisos de pools',
        loadComponent: () => import('./pools/permisos-pool-form/permisos-pool-form.component').then(m => m.PermisosPoolFormComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
