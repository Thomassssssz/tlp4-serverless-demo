import { test, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import lista from '../api/productos/index.js';
import detalle from '../api/productos/[id].js';
import stock from '../api/productos/[id]/stock.js';

const id = '00000000-0000-0000-0000-000000000001';
const producto = { id, nombre:'Teclado', descripcion:'USB', categoria:'Hardware', precio:20, stock:5, fecha_creacion:'2026-01-01T00:00:00Z' };
const originalFetch = globalThis.fetch;
const originalUrl = process.env.SUPABASE_URL;
const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;
type Call = { url: URL; method: string; body: Record<string, unknown> | undefined };
let calls: Call[] = [];
let responses: { status: number; body: unknown }[] = [];

beforeEach(() => {
  calls = []; responses = [];
  process.env.SUPABASE_URL = 'https://test-project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-key-only-for-tests';
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push({url,method:init?.method ?? 'GET',body:init?.body ? JSON.parse(String(init.body)) : undefined});
    const response = responses.shift();
    assert.ok(response, 'Solicitud inesperada a Supabase');
    return new Response(JSON.stringify(response.body), {status:response.status,headers:{'Content-Type':'application/json'}});
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL=originalUrl;
  if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY=originalKey;
});

async function invoke(handler: Handler, method: string, body?: unknown, query: Record<string,string> = {}) {
  let status = 200; let payload: unknown;
  const headers: Record<string,unknown> = {};
  const res = {
    setHeader(key: string, value: unknown) { headers[key]=value; return this; },
    status(value: number) { status=value; return this; },
    json(value: unknown) { payload=value; return this; },
  } as unknown as VercelResponse;
  const req = {method,body,query,headers:{'content-type':'application/json'}} as unknown as VercelRequest;
  await handler(req,res);
  return {status,payload:payload as {data: typeof producto | typeof producto[]; error?:string},headers};
}
function reply(body: unknown, status=200) { responses.push({status,body}); }

test('lista y busca por nombre usando Supabase',async () => {
  reply([producto]);
  const res=await invoke(lista,'GET',undefined,{nombre:'Teclado'});
  assert.equal(res.status,200);
  assert.deepEqual(res.payload.data,[producto]);
  assert.equal(calls[0].url.searchParams.get('nombre'),'ilike.%Teclado%');
  assert.equal(res.headers['Cache-Control'],'no-store');
});
test('escapa comodines en búsquedas literales',async () => {
  reply([]);
  await invoke(lista,'GET',undefined,{nombre:'100%_USB'});
  assert.equal(calls[0].url.searchParams.get('nombre'),'ilike.%100\\%\\_USB%');
});
test('lista también productos más allá de la primera página',async () => {
  reply(Array.from({length:500},()=>producto)); reply([{...producto,nombre:'Último'}]);
  const res=await invoke(lista,'GET');
  assert.equal((res.payload.data as unknown[]).length,501);
  assert.equal(calls[1].url.searchParams.get('offset'),'500');
});
test('crea producto y deja ID y fecha a PostgreSQL',async () => {
  reply(producto,201);
  const input={nombre:'Teclado',descripcion:'USB',categoria:'Hardware',precio:20,stock:5};
  const res=await invoke(lista,'POST',input);
  assert.equal(res.status,201); assert.deepEqual(res.payload.data,producto);
  assert.deepEqual(calls[0].body,input);
});
test('obtiene por ID',async () => {
  reply(producto);
  assert.equal((await invoke(detalle,'GET',undefined,{id})).status,200);
  assert.equal(calls[0].url.searchParams.get('id'),'eq.'+id);
});
test('actualiza con control del stock original',async () => {
  reply({...producto,stock:8});
  const res=await invoke(detalle,'PUT',{...producto,stock:8,expected_stock:5},{id});
  assert.equal(res.status,200); assert.equal(calls[0].url.searchParams.get('stock'),'eq.5');
  assert.ok(!('expected_stock' in (calls[0].body ?? {})));
});
test('edición concurrente devuelve 409 si el stock cambió',async () => {
  reply(null); reply({id});
  assert.equal((await invoke(detalle,'PUT',{...producto,expected_stock:5},{id})).status,409);
});
test('editar producto eliminado devuelve 404',async () => {
  reply(null); reply(null);
  assert.equal((await invoke(detalle,'PUT',{...producto,expected_stock:5},{id})).status,404);
});
test('aumenta stock mediante RPC y devuelve el dato persistido',async () => {
  reply([{...producto,stock:7}]);
  const res=await invoke(stock,'PATCH',{delta:2},{id});
  assert.equal(res.status,200); assert.equal((res.payload.data as typeof producto).stock,7);
  assert.ok(calls[0].url.pathname.endsWith('/rpc/actualizar_stock'));
  assert.deepEqual(calls[0].body,{p_id:id,p_delta:2});
});
test('disminuye stock mediante RPC',async () => {
  reply([{...producto,stock:0}]);
  assert.equal((await invoke(stock,'PATCH',{delta:-5},{id})).status,200);
  assert.equal(calls[0].body?.p_delta,-5);
});
test('stock insuficiente devuelve 409 sin inventar un valor local',async () => {
  reply({code:'P0001',message:'internal'},400);
  const res=await invoke(stock,'PATCH',{delta:-10},{id});
  assert.equal(res.status,409); assert.ok(res.payload.error?.includes('Stock insuficiente'));
});
test('RPC de producto inexistente devuelve 404',async () => {
  reply({code:'P0002',message:'internal'},400);
  assert.equal((await invoke(stock,'PATCH',{delta:1},{id})).status,404);
});
test('elimina realmente mediante DELETE en Supabase',async () => {
  reply(producto);
  assert.equal((await invoke(detalle,'DELETE',undefined,{id})).status,200);
  assert.equal(calls[0].method,'DELETE');
});
test('consulta y eliminación inexistentes devuelven 404',async () => {
  for (const method of ['GET','DELETE']) {
    reply(null);
    assert.equal((await invoke(detalle,method,undefined,{id})).status,404);
  }
});
test('rechaza métodos inválidos antes de contactar Supabase',async () => {
  assert.equal((await invoke(lista,'DELETE')).status,405);
  assert.equal((await invoke(stock,'GET',undefined,{id})).status,405);
  assert.equal(calls.length,0);
});
test('rechaza datos e ID inválidos antes de contactar Supabase',async () => {
  assert.equal((await invoke(lista,'POST',{...producto,stock:-1})).status,400);
  assert.equal((await invoke(detalle,'GET',undefined,{id:'abc'})).status,400);
  assert.equal((await invoke(stock,'PATCH',{delta:0},{id})).status,400);
  assert.equal(calls.length,0);
});
test('JSON mal formado devuelve 400',async () => {
  assert.equal((await invoke(lista,'POST','{mal')).status,400);
});
test('sin credenciales devuelve 503, sin contactos de red',async () => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.equal((await invoke(lista,'GET')).status,503);
  assert.equal(calls.length,0);
});
test('errores internos no exponen secretos ni detalles de la base',async () => {
  reply({code:'XX000',message:'fake-private-detail'},500);
  const res=await invoke(lista,'GET');
  assert.equal(res.status,500); assert.ok(!JSON.stringify(res.payload).includes('fake-private-detail'));
});
