export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  stock: number;
  fecha_creacion: string;
}

export type ProductoInput = Pick<Producto, 'nombre' | 'descripcion' | 'categoria' | 'precio' | 'stock'>;
export type ProductoUpdate = ProductoInput & { expected_stock: number };
export interface ApiResponse<T> { data: T }
export interface ApiErrorBody { error: string }
