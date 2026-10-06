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
