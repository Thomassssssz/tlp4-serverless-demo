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
