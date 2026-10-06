import type { ProductoInput } from '../src/types/Producto.js';
import { HttpError } from './respuestas.js';

export function objeto(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Enviá un objeto JSON.');
  }
  return value as Record<string, unknown>;
}

export function entero(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 2147483647) {
    throw new HttpError(400, `${name} debe ser un entero entre 0 y 2147483647.`);
  }
  return value;
}

function texto(value: unknown, name: string, max: number, obligatorio = false): string {
  if (value === undefined && !obligatorio) return '';
  if (typeof value !== 'string') throw new HttpError(400, `${name} debe ser texto.`);
  const result = value.trim();
  if (obligatorio && !result) throw new HttpError(400, `${name} es obligatorio.`);
  if ([...result].length > max) throw new HttpError(400, `${name} admite hasta ${max} caracteres.`);
  return result;
}

export function validarProducto(value: unknown): ProductoInput {
  const body = objeto(value);
  const precio = body.precio;
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0 || precio > 9999999999.99) {
    throw new HttpError(400, 'El precio debe ser un número entre 0 y 9999999999.99.');
  }
  if (Math.abs(precio * 100 - Math.round(precio * 100)) > 0.0001) {
    throw new HttpError(400, 'El precio admite hasta dos decimales.');
  }
  return {
    nombre: texto(body.nombre, 'El nombre', 120, true),
    descripcion: texto(body.descripcion, 'La descripción', 1000),
    categoria: texto(body.categoria, 'La categoría', 80),
    precio,
    stock: entero(body.stock, 'El stock'),
  };
}

export function validarId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, 'El ID del producto debe ser un UUID válido.');
  }
  return value;
}

export function validarDelta(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value === 0 || Math.abs(value) > 2147483647) {
    throw new HttpError(400, 'La variación debe ser un entero distinto de cero dentro del rango permitido.');
  }
  return value;
}

export function validarBusqueda(value: unknown): string {
  if (value === undefined) return '';
  return texto(value, 'La búsqueda', 120);
}
