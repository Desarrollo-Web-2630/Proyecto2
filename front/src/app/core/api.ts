import axios from 'axios';
import { environment } from '../../environments/environment';

// Cliente HTTP que usan todos los servicios
export const api = axios.create({
  baseURL: environment.apiUrl,
  headers: { 'Content-Type': 'application/json' }
});
