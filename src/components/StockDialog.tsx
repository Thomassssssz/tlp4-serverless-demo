import { useState, type FormEvent } from 'react';
import type { Producto } from '../types/Producto';
import Dialog from './Dialog';
import Icon from './Icon';

export default function StockDialog({ producto, direction, busy, onSubmit, onClose }: {
  producto: Producto; direction: 1 | -1; busy: boolean; onSubmit: (delta: number) => Promise<void>; onClose: () => void;
}) {
  const [cantidad,setCantidad] = useState('1');
  const [error,setError] = useState('');
  const add = direction === 1;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    const value = Number(cantidad);
    if (!Number.isInteger(value) || value <= 0 || value > 2147483647) { setError('Ingresá una cantidad entera mayor a cero.'); return; }
    if (!add && value > producto.stock) { setError('La cantidad supera el stock mostrado. Actualizá la lista si cambió.'); return; }
    try { await onSubmit(value * direction); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos actualizar el stock.'); }
  }
  return <Dialog title={add ? 'Aumentar stock' : 'Disminuir stock'} subtitle={producto.nombre} busy={busy} onClose={onClose}>
    <form className="product-form" onSubmit={submit}>
      {error && <div className="message error" role="alert">{error}</div>}
      <div className="stock-current">Stock registrado <strong>{producto.stock} <small>unidades</small></strong></div>
      <label>Cantidad a {add ? 'agregar' : 'retirar'}<input name="cantidad" autoFocus type="number" min="1" max={add ? 2147483647 : producto.stock} step="1" required value={cantidad} onChange={e => setCantidad(e.target.value)} /></label>
      <p className="form-hint">El cambio se confirma después de guardarse en la base de datos.</p>
      <div className="dialog-footer"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={busy}><Icon name={add ? 'plus' : 'minus'} />{busy ? 'Guardando…' : 'Confirmar cambio'}</button></div>
    </form>
  </Dialog>;
}
