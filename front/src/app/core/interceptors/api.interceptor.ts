import { HttpInterceptorFn } from '@angular/common/http';

// Antepone /api a cada petición: los servicios escriben solo '/v1/...'
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ url: `/api${req.url}` }));
};
