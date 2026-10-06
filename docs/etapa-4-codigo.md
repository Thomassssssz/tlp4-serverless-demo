# Etapa 4 — Funciones Serverless

Archivos creados: `server/respuestas.ts`, `server/validaciones.ts`, `api/productos/index.ts`, `api/productos/[id].ts`, `api/productos/[id]/stock.ts`.

Comandos: `npm run typecheck` y `npm test`. Las pruebas HTTP utilizan el cliente real de Supabase con transporte controlado; no prueban conexión remota.

## server/respuestas.ts

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function permitirMetodo(req: VercelRequest, res: VercelResponse, methods: string[]) {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.method || !methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    throw new HttpError(405, 'Método no permitido.');
  }
}

export function leerBody(req: VercelRequest): unknown {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Enviá los datos como application/json.');
  }
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); }
    catch { throw new HttpError(400, 'El JSON enviado no es válido.'); }
  }
  return req.body;
}

export function responderError(res: VercelResponse, error: unknown) {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  // No registrar cuerpos, cabeceras, claves ni mensajes internos de Supabase.
  console.error('Falló una operación de productos; revisar configuración y disponibilidad de la base.');
  return res.status(500).json({ error: 'No pudimos completar la operación. Intentá nuevamente.' });
}

```

## server/validaciones.ts

```ts
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

```

## api/productos/index.ts

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../../server/supabase.js';
import { leerBody, permitirMetodo, responderError } from '../../server/respuestas.js';
import { validarBusqueda, validarProducto } from '../../server/validaciones.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    permitirMetodo(req, res, ['GET', 'POST']);
    if (req.method === 'GET') {
      const nombre = validarBusqueda(req.query.nombre);
      let query = getSupabase().from('productos').select('*').order('fecha_creacion', { ascending: false }).order('id');
      if (nombre) {
        // Escapar comodines: buscar el texto escrito, no patrones SQL.
        query = query.ilike('nombre', `%${nombre.replace(/[\\%_]/g, '\\$&')}%`);
      }
      // Supabase limita resultados por defecto. Se recorren páginas sin ocultar productos.
      const productos: unknown[] = [];
      const pageSize = 500;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await query.range(from, from + pageSize - 1);
        if (error) throw error;
        productos.push(...(data ?? []));
        if (!data || data.length < pageSize) break;
      }
      return res.status(200).json({ data: productos });
    }
    const producto = validarProducto(leerBody(req));
    const { data, error } = await getSupabase().from('productos').insert(producto).select('*').single();
    if (error) throw error;
    return res.status(201).json({ data });
  } catch (error) { return responderError(res, error); }
}

```

## api/productos/[id].ts

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../../server/supabase.js';
import { HttpError, leerBody, permitirMetodo, responderError } from '../../server/respuestas.js';
import { entero, objeto, validarId, validarProducto } from '../../server/validaciones.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    permitirMetodo(req, res, ['GET', 'PUT', 'DELETE']);
    const id = validarId(req.query.id);
    if (req.method === 'PUT') {
      const body = objeto(leerBody(req));
      const producto = validarProducto(body);
      const expectedStock = entero(body.expected_stock, 'El stock original');
      const db = getSupabase();
      // Comprobación y escritura se realizan en la misma sentencia SQL.
      const { data, error } = await db.from('productos').update(producto)
        .eq('id', id).eq('stock', expectedStock).select('*').maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: exists, error: lookupError } = await db.from('productos').select('id').eq('id', id).maybeSingle();
        if (lookupError) throw lookupError;
        throw new HttpError(exists ? 409 : 404, exists
          ? 'El stock cambió mientras editabas. Actualizá la lista y volvé a intentarlo.'
          : 'Producto no encontrado.');
      }
      return res.status(200).json({ data });
    }
    const db = getSupabase();
    const { data, error } = req.method === 'DELETE'
      ? await db.from('productos').delete().eq('id', id).select('*').maybeSingle()
      : await db.from('productos').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'Producto no encontrado.');
    return res.status(200).json({ data });
  } catch (error) { return responderError(res, error); }
}

```

## api/productos/[id]/stock.ts

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../../../server/supabase.js';
import { HttpError, leerBody, permitirMetodo, responderError } from '../../../server/respuestas.js';
import { objeto, validarDelta, validarId } from '../../../server/validaciones.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    permitirMetodo(req, res, ['PATCH']);
    const id = validarId(req.query.id);
    const delta = validarDelta(objeto(leerBody(req)).delta);
    const { data, error } = await getSupabase().rpc('actualizar_stock', { p_id: id, p_delta: delta });
    if (error?.code === 'P0002') throw new HttpError(404, 'Producto no encontrado.');
    if (error?.code === 'P0001') throw new HttpError(409, 'Stock insuficiente o límite de stock excedido.');
    if (error) throw error;
    if (!Array.isArray(data) || !data[0]) throw new Error('Unexpected RPC response');
    return res.status(200).json({ data: data[0] });
  } catch (error) { return responderError(res, error); }
}

```
