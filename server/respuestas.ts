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
