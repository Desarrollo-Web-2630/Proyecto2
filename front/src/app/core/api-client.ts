import { Injectable, inject } from '@angular/core';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { environment } from '../../environments/environment';
import { SesionService } from './services/sesion.service';
import { aApiError } from './api-error';

// Encabezado que usa el backend para saber la empresa
export const ENCABEZADO_EMPRESA = 'X-Empresa-Id';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly sesion = inject(SesionService);
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: environment.apiUrl,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.http.interceptors.request.use((config) => {
      const empresaId = this.sesion.empresaId();
      if (empresaId !== null) {
        config.headers.set(ENCABEZADO_EMPRESA, String(empresaId));
      }
      return config;
    });

    this.http.interceptors.response.use(
      (respuesta) => respuesta,
      (error: unknown) => Promise.reject(aApiError(error)),
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.http.get<T>(url, config);
    return data;
  }

  async post<T, B = unknown>(url: string, cuerpo?: B, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.http.post<T>(url, cuerpo, config);
    return data;
  }

  async put<T, B = unknown>(url: string, cuerpo?: B, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.http.put<T>(url, cuerpo, config);
    return data;
  }

  async patch<T, B = unknown>(url: string, cuerpo?: B, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.http.patch<T>(url, cuerpo, config);
    return data;
  }

  async delete(url: string, config?: AxiosRequestConfig): Promise<void> {
    await this.http.delete(url, config);
  }
}
