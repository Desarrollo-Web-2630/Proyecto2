import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Usuarios',
    loadComponent: () => import('../pages/usuarios/usuario-list/usuario-list.component').then(m => m.UsuarioListComponent)
  },
  {
    path: 'nuevo',
    title: 'Invitar usuario',
    loadComponent: () => import('../pages/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent)
  }
];
