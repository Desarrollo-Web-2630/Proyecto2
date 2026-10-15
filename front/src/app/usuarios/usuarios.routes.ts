import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Usuarios',
    loadComponent: () => import('./usuario-list/usuario-list.component').then(m => m.UsuarioListComponent)
  },
  {
    path: 'nuevo',
    title: 'Invitar usuario',
    loadComponent: () => import('./usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent)
  }
];
