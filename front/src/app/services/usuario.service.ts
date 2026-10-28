import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { RolAcceso, Usuario, UsuarioRequest } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = '/v1/usuarios';

  list(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  buscar(page: number, size: number): Observable<Page<Usuario>> {
    return this.http.get<Page<Usuario>>(`${this.url}/buscar`, { params: { page, size } });
  }

  create(usuario: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, usuario);
  }

  cambiarRol(id: number, rolAcceso: RolAcceso): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/${id}/rol`, null, { params: { rolAcceso } });
  }

  desactivar(id: number): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.url}/${id}/desactivar`, null);
  }
}
