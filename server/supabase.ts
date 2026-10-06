import { createClient } from '@supabase/supabase-js';
import { HttpError } from './respuestas.js';

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === 'REEMPLAZAR_EN_CONFIGURACION_SEGURA' || url.includes('TU-PROYECTO')) {
    throw new HttpError(503, 'La base de datos todavía no está configurada.');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
