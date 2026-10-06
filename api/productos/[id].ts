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
