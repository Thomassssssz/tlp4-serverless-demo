import { useState, type FormEvent } from 'react';
import type { Producto, ProductoInput } from '../types/Producto';
import Dialog from './Dialog';
import Icon from './Icon';

export default function ProductoForm({ producto, busy, onSubmit, onClose }: {
  producto?: Producto; busy: boolean; onSubmit: (data: ProductoInput) => Promise<void>; onClose: () => void;
}) {
  const [draft, setDraft] = useState({
    nombre: producto?.nombre ?? '', descripcion: producto?.descripcion ?? '', categoria: producto?.categoria ?? '',
    precio: producto ? String(producto.precio) : '', stock: producto ? String(producto.stock) : '0',
  });
  const [error, setError] = useState('');
  function change(field: keyof typeof draft, value: string) { setDraft(old => ({ ...old, [field]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const precio = Number(draft.precio);
    const stock = Number(draft.stock);
    if (!draft.nombre.trim()) { setError('Ingresá el nombre del producto.'); return; }
    if (draft.precio.trim() === '' || !Number.isFinite(precio) || precio < 0) { setError('Ingresá un precio igual o mayor a cero.'); return; }
    if (draft.stock.trim() === '' || !Number.isInteger(stock) || stock < 0 || stock > 2147483647) { setError('El stock debe ser un entero no negativo.'); return; }
    try { await onSubmit({ nombre: draft.nombre.trim(), descripcion: draft.descripcion.trim(), categoria: draft.categoria.trim(), precio, stock }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos guardar el producto.'); }
  }
  return <Dialog title={producto ? 'Editar producto' : 'Agregar producto'} subtitle="Completá los datos de tu inventario." busy={busy} onClose={onClose}>
    <form onSubmit={submit} className="product-form">
      {error && <div className="message error" role="alert">{error}</div>}
      <label>Nombre <span className="required">*</span><input name="nombre" required maxLength={120} autoFocus placeholder="Ej. Teclado inalámbrico" value={draft.nombre} onChange={e => change('nombre',e.target.value)} /></label>
      <label>Descripción<textarea name="descripcion" maxLength={1000} rows={3} placeholder="Detalles del producto (opcional)" value={draft.descripcion} onChange={e => change('descripcion',e.target.value)} /></label>
      <label>Categoría<input name="categoria" maxLength={80} placeholder="Ej. Tecnología" value={draft.categoria} onChange={e => change('categoria',e.target.value)} /></label>
      <div className="form-grid">
        <label>Precio (ARS) <span className="required">*</span><input name="precio" type="number" required min="0" max="9999999999.99" step="0.01" placeholder="0,00" value={draft.precio} onChange={e => change('precio',e.target.value)} /></label>
        <label>Stock <span className="required">*</span><input name="stock" type="number" required min="0" max="2147483647" step="1" value={draft.stock} onChange={e => change('stock',e.target.value)} /></label>
      </div>
      <p className="form-hint">Los productos con 5 unidades o menos se marcarán con una alerta.</p>
      <div className="dialog-footer"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="button primary" type="submit" disabled={busy}><Icon name="check" />{busy ? 'Guardando…' : 'Guardar producto'}</button></div>
    </form>
  </Dialog>;
}
