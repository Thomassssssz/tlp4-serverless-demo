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
