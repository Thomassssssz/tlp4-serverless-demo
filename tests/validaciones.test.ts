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
