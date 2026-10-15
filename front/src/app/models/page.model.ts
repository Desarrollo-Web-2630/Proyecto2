// Respuesta paginada de Spring (solo los campos que se usan)
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
