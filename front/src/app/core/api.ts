import axios from 'axios';

// Cliente HTTP de todos los servicios
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});
