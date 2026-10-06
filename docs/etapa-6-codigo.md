# Etapa 6 — Conexión HTTP

Archivos creados: `src/services/productosService.ts`.

productosService.ts es el único lugar con fetch. Producto.ts contiene tipos comunes. La pantalla usa sus funciones y consulta nuevamente después de una escritura confirmada. Comandos: npm test y npm run build.

## src/services/productosService.ts

```ts
import type { Producto, ProductoInput, ProductoUpdate } from '../types/Producto';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Único punto de acceso HTTP del frontend. No contiene claves de Supabase.
async function request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'No pudimos conectar con el backend. Revisá tu conexión e intentá nuevamente.');
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError(response.status, 'El backend no está disponible. Para el sistema completo usá Vercel o vercel dev.');
  }
  let result: unknown;
  try { result = await response.json(); }
  catch { throw new ApiError(response.status, 'La API devolvió una respuesta JSON inválida.'); }
  if (!response.ok) {
    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
      ? result.error : 'No pudimos completar la operación.';
    throw new ApiError(response.status, message);
  }
  if (!result || typeof result !== 'object' || !('data' in result)) {
    throw new ApiError(response.status, 'La API devolvió una respuesta inesperada.');
  }
  return result.data as T;
}

export function getProductos(nombre = '', signal?: AbortSignal) {
  const query = nombre.trim() ? '?nombre=' + encodeURIComponent(nombre.trim()) : '';
  return request<Producto[]>('/api/productos' + query, 'GET', undefined, signal);
}
export function getProducto(id: string) {
  return request<Producto>('/api/productos/' + encodeURIComponent(id));
}
export function crearProducto(producto: ProductoInput) {
  return request<Producto>('/api/productos', 'POST', producto);
}
export function actualizarProducto(id: string, producto: ProductoUpdate) {
  return request<Producto>('/api/productos/' + encodeURIComponent(id), 'PUT', producto);
}
export function actualizarStock(id: string, delta: number) {
  return request<Producto>('/api/productos/' + encodeURIComponent(id) + '/stock', 'PATCH', { delta });
}
export function eliminarProducto(id: string) {
  return request<Producto>('/api/productos/' + encodeURIComponent(id), 'DELETE');
}

```

## src/types/Producto.ts

```ts
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

```
