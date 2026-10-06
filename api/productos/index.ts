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
