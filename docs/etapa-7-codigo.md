# Etapa 7 — Pruebas

Archivos creados: `tests/productos-api.test.ts`, `tests/productos-service.test.ts`, `tests/validaciones.test.ts`, `scripts/smoke-crud.mjs`.

Las pruebas usan el runner de Node y TypeScript con tsx. El script smoke-crud opera contra tu despliegue real, no contra datos locales. Comando local: npm test. Remoto pendiente: STOCK_API_URL=<origen> npm run test:crud.

## tests/productos-api.test.ts

```ts
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

```

## tests/productos-service.test.ts

```ts
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getProductos, crearProducto, actualizarProducto, actualizarStock, eliminarProducto, ApiError } from '../src/services/productosService.js';

const originalFetch=globalThis.fetch;
afterEach(()=>{globalThis.fetch=originalFetch;});
test('servicio centraliza rutas, métodos y cuerpos sin claves de Supabase',async()=>{
  const calls:{path:string;method:string;body?:unknown;headers?:unknown}[]=[];
  globalThis.fetch=(async (input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    calls.push({path:String(input),method:init?.method ?? 'GET',body:init?.body ? JSON.parse(String(init.body)) : undefined,headers:init?.headers});
    return Response.json({data:[]});
  }) as typeof fetch;
  const producto={nombre:'Teclado',descripcion:'',categoria:'',precio:1,stock:0};
  await getProductos(' A & B ');
  await crearProducto(producto);
  await actualizarProducto('id',{...producto,expected_stock:0});
  await actualizarStock('id',-2);
  await eliminarProducto('id');
  assert.equal(calls[0].path,'/api/productos?nombre=A%20%26%20B');
  assert.deepEqual(calls.map(c=>c.method),['GET','POST','PUT','PATCH','DELETE']);
  assert.deepEqual(calls[3].body,{delta:-2});
  assert.ok(!JSON.stringify(calls).includes('service_role'));
});
test('propaga el mensaje de errores HTTP al formulario',async()=>{
  globalThis.fetch=(async()=>Response.json({error:'Stock insuficiente'},{status:409})) as typeof fetch;
  await assert.rejects(actualizarStock('id',-10),e=>e instanceof ApiError && e.status===409 && e.message==='Stock insuficiente');
});
test('reconoce Vite sin API y evita interpretar HTML como productos',async()=>{
  globalThis.fetch=(async()=>new Response('<html></html>',{headers:{'Content-Type':'text/html'}})) as typeof fetch;
  await assert.rejects(getProductos(),e=>e instanceof ApiError && e.message.includes('backend no está disponible'));
});
test('fallos de red no producen resultados falsos',async()=>{
  globalThis.fetch=(async()=>{throw new TypeError('network');}) as typeof fetch;
  await assert.rejects(getProductos(),e=>e instanceof ApiError && e.status===0);
});
test('abortos permiten descartar búsquedas anteriores',async()=>{
  globalThis.fetch=(async()=>{throw new DOMException('aborted','AbortError');}) as typeof fetch;
  await assert.rejects(getProductos(),e=>e instanceof DOMException && e.name==='AbortError');
});

```

## tests/validaciones.test.ts

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarProducto, validarDelta, validarId, validarBusqueda } from '../server/validaciones.js';

const producto = { nombre: '  Teclado  ', descripcion: '', categoria: 'Hardware', precio: 12.25, stock: 5 };
test('producto válido: limpia espacios y conserva precio y stock', () => {
  assert.deepEqual(validarProducto(producto), { ...producto, nombre: 'Teclado' });
  assert.equal(validarProducto({ ...producto, precio: 0, stock: 0 }).stock, 0);
});
for (const [campo, valor] of [
  ['nombre','   '], ['nombre','a'.repeat(121)], ['nombre',null],
  ['precio',-1], ['precio',Infinity], ['precio','20'], ['precio',1.234],
  ['stock',-1], ['stock',1.5], ['stock','2'], ['stock',2147483648],
  ['descripcion','a'.repeat(1001)], ['categoria','a'.repeat(81)],
] as const) {
  test(`rechaza ${campo} inválido: ${String(valor).slice(0,20)}`, () => {
    assert.throws(() => validarProducto({ ...producto, [campo]: valor }));
  });
}
test('rechaza cuerpos ausentes o arrays', () => {
  for (const body of [null, undefined, [], 'text']) assert.throws(() => validarProducto(body));
});
test('la variación acepta enteros positivos y negativos, nunca cero o fracciones', () => {
  assert.equal(validarDelta(2),2); assert.equal(validarDelta(-2),-2);
  for (const value of [0, 0.5, '1', NaN, 2147483648]) assert.throws(() => validarDelta(value));
});
test('UUID y búsqueda se validan antes de acceder a la base', () => {
  assert.equal(validarId('00000000-0000-0000-0000-000000000001'),'00000000-0000-0000-0000-000000000001');
  for (const value of ['abc', ['id'], undefined]) assert.throws(() => validarId(value));
  assert.equal(validarBusqueda(undefined),'');
  assert.equal(validarBusqueda('  teclado  '),'teclado');
  assert.throws(() => validarBusqueda(['a','b']));
});

```

## scripts/smoke-crud.mjs

```js
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const target = process.env.STOCK_API_URL;
if (!target) {
  console.error('Definí STOCK_API_URL con el dominio de tu proyecto académico. Esta prueba escribe y elimina un producto real.');
  process.exit(1);
}
const base = new URL(target);
if (base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Usá solo el origen del despliegue, sin credenciales, rutas ni parámetros.');
const name = 'TP-prueba-' + randomUUID().slice(0,8);
const input = {nombre:name,descripcion:'Registro temporal para prueba CRUD',categoria:'Prueba',precio:10.25,stock:8};
let id;
async function api(path, method='GET', body) {
  const response = await fetch(new URL(path,base),{
    method,
    headers: body === undefined ? {Accept:'application/json'} : {Accept:'application/json','Content-Type':'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  assert.ok(response.headers.get('content-type')?.includes('application/json'),'La API no devolvió JSON; revisá dominio, rutas y acceso al despliegue.');
  return {status:response.status,body:await response.json()};
}
function status(result, expected) { assert.equal(result.status,expected,JSON.stringify(result.body)); }
try {
  status(await api('/api/productos','POST',{...input,stock:-1}),400);
  const created=await api('/api/productos','POST',input); status(created,201);
  id=created.body.data.id;
  assert.ok(id); assert.ok(created.body.data.fecha_creacion);
  console.log('Producto temporal:',name,'ID:',id);
  const path='/api/productos/'+id;
  const search=await api('/api/productos?nombre='+encodeURIComponent(name)); status(search,200);
  assert.ok(search.body.data.some(p=>p.id===id));
  status(await api(path),200);
  const updated=await api(path,'PUT',{...input,nombre:name+'-editado',precio:15,expected_stock:8}); status(updated,200);
  assert.equal(updated.body.data.precio,15);
  status(await api(path,'PUT',{...input,stock:9,expected_stock:7}),409);
  const increased=await api(path+'/stock','PATCH',{delta:2}); status(increased,200); assert.equal(increased.body.data.stock,10);
  const low=await api(path+'/stock','PATCH',{delta:-5}); status(low,200); assert.equal(low.body.data.stock,5);
  const empty=await api(path+'/stock','PATCH',{delta:-5}); status(empty,200); assert.equal(empty.body.data.stock,0);
  status(await api(path+'/stock','PATCH',{delta:-1}),409);
  status(await api(path+'/stock','PATCH',{delta:0}),400);
  status(await api(path+'/stock'),405);
  const persisted=await api(path); status(persisted,200); assert.equal(persisted.body.data.stock,0);
  // Dos salidas simultáneas contra la última unidad: solo una puede tener éxito.
  status(await api(path+'/stock','PATCH',{delta:1}),200);
  const concurrent=await Promise.all([api(path+'/stock','PATCH',{delta:-1}),api(path+'/stock','PATCH',{delta:-1})]);
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
  assert.equal((await api(path)).body.data.stock,0);
  status(await api(path,'DELETE'),200); id=undefined;
  status(await api(path),404);
  console.log('PASS CRUD real: creación, búsqueda, consulta, edición, conflictos, stock, concurrencia, persistencia y eliminación.');
} catch (error) {
  console.error('FAIL CRUD:',error instanceof Error ? error.message : 'Error inesperado');
  process.exitCode=1;
} finally {
  if (id) {
    try {
      const cleaned=await api('/api/productos/'+id,'DELETE');
      if (![200,404].includes(cleaned.status)) throw new Error('Respuesta '+cleaned.status);
      console.log('Producto temporal limpiado.');
    } catch {
      console.error('No se pudo limpiar el producto temporal. Eliminá manualmente el ID informado arriba.');
      process.exitCode=1;
    }
  }
}

```
