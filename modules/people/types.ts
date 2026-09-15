
export interface Person {
  id: string; // UUID
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  pais: string;
  tipo: 'cliente' | 'empleado' | 'repartidor'; // default: cliente
  fechaCreacion: string; // timestamp ISO
  estado: 'activo' | 'en_riesgo';
}
