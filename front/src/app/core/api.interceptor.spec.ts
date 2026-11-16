import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SesionService } from '../services/sesion.service';
import { apiInterceptor } from './api.interceptor';
import { sesionDePrueba } from './sesion-de-prueba';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let sesion: SesionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    sesion = TestBed.inject(SesionService);
  });

  afterEach(() => backend.verify());

  it('antepone /api y manda el token en Authorization', () => {
    sesion.iniciar(sesionDePrueba('EDITOR'));
    http.get('/v1/procesos').subscribe();

    const req = backend.expectOne('/api/v1/procesos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    req.flush([]);
  });

  it('sin sesión no manda Authorization', () => {
    http.post('/auth/login', {}).subscribe();

    const req = backend.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('ya no manda el encabezado X-Empresa-Id', () => {
    sesion.iniciar(sesionDePrueba('ADMIN'));
    http.get('/v1/usuarios').subscribe();

    const req = backend.expectOne('/api/v1/usuarios');
    expect(req.request.headers.has('X-Empresa-Id')).toBeFalse();
    req.flush([]);
  });

  it('ante un 401 cierra la sesión y manda al login', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    sesion.iniciar(sesionDePrueba('ADMIN'));

    http.get('/v1/procesos').subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/procesos').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(sesion.usuario()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expirada: true } });
  });

  it('un 401 del login no redirige: lo muestra el formulario', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    http.post('/auth/login', {}).subscribe({ error: () => undefined });
    backend.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('un 403 no cierra la sesión', () => {
    sesion.iniciar(sesionDePrueba('LECTURA'));

    http.delete('/v1/procesos/1').subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/procesos/1').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(sesion.usuario()).not.toBeNull();
  });
});
