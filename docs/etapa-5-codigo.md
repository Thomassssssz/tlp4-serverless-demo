# Etapa 5 — Frontend

Archivos creados: `src/components/Dialog.tsx`, `src/components/Icon.tsx`, `src/components/ProductoForm.tsx`, `src/components/ProductosTable.tsx`, `src/components/StockBadge.tsx`, `src/components/StockDialog.tsx`, `src/pages/ProductosPage.tsx`.

Archivos modificados: src/App.tsx, src/styles.css. Dialog controla foco/cierre; ProductoForm permite crear y editar; StockDialog valida cantidades; ProductosTable y StockBadge muestran productos y estados; Icon evita una dependencia de iconos; ProductosPage organiza consultas y acciones. Comando: npm run build.

## src/components/Dialog.tsx

```tsx
import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

export default function Dialog({ title, subtitle, children, busy, onClose }: {
  title: string; subtitle?: string; children: ReactNode; busy: boolean; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="dialog-header">
      <div><h2 id="dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      <button type="button" className="icon-button" aria-label="Cerrar" disabled={busy} onClick={onClose}><Icon name="close" /></button>
    </div>
    {children}
  </dialog>;
}

```

## src/components/Icon.tsx

```tsx
type IconName = 'box' | 'search' | 'plus' | 'minus' | 'edit' | 'trash' | 'close' | 'refresh' | 'arrow' | 'check' | 'alert';
const paths: Record<IconName, string[]> = {
  box: ['M21 8l-9 5-9-5', 'M12 13v9', 'M3 8l9-5 9 5v10l-9 5-9-5z', 'M7.5 5.5l9 5'],
  search: ['M21 21l-4.5-4.5', 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  edit: ['M16 3l5 5-12 12-6 1 1-6z', 'M14 5l5 5'],
  trash: ['M3 6h18', 'M9 6V3h6v3', 'M5 6l1 15h12l1-15', 'M10 10v7', 'M14 10v7'],
  close: ['M6 6l12 12', 'M6 18L18 6'],
  refresh: ['M20 7a8 8 0 1 0 1 8', 'M20 2v5h-5'],
  arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
  check: ['M5 12l4 4L19 6'],
  alert: ['M12 3L2 21h20z', 'M12 9v5', 'M12 17v.1'],
};
export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name].map((d,i) => <path key={i} d={d} />)}</svg>;
}

```

## src/components/ProductoForm.tsx

```tsx
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

```

## src/components/ProductosTable.tsx

```tsx
import type { Producto } from '../types/Producto';
import Icon from './Icon';
import StockBadge from './StockBadge';

const money = new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'});
export default function ProductosTable({ productos, busy, onEdit, onStock, onDelete }: {
  productos: Producto[]; busy: boolean; onEdit: (producto: Producto) => void;
  onStock: (producto: Producto, direction: 1 | -1) => void; onDelete: (producto: Producto) => void;
}) {
  return <div className="table-scroll"><table>
    <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th className="actions-heading">Acciones</th></tr></thead>
    <tbody>{productos.map(producto => <tr key={producto.id}>
      <td><div className="product-cell"><div className="product-avatar"><Icon name="box" size={21} /></div><div><strong>{producto.nombre}</strong><span title={producto.descripcion}>{producto.descripcion || 'Sin descripción'}</span></div></div></td>
      <td data-label="Categoría"><span className="category">{producto.categoria || 'Sin categoría'}</span></td>
      <td data-label="Precio" className="price">{money.format(producto.precio)}</td>
      <td data-label="Stock"><strong className={producto.stock === 0 ? 'stock-number zero' : 'stock-number'}>{producto.stock}</strong><span className="units"> uds.</span></td>
      <td data-label="Estado"><StockBadge stock={producto.stock} /></td>
      <td><div className="row-actions">
        <button className="icon-button" disabled={busy} aria-label={`Editar ${producto.nombre}`} title="Editar producto" onClick={() => onEdit(producto)}><Icon name="edit" size={18} /></button>
        <button className="icon-button" disabled={busy} aria-label={`Aumentar stock de ${producto.nombre}`} title="Aumentar stock" onClick={() => onStock(producto,1)}><Icon name="plus" size={18} /></button>
        <button className="icon-button" disabled={busy || producto.stock === 0} aria-label={`Disminuir stock de ${producto.nombre}`} title={producto.stock === 0 ? 'Sin stock para retirar' : 'Disminuir stock'} onClick={() => onStock(producto,-1)}><Icon name="minus" size={18} /></button>
        <button className="icon-button danger-icon" disabled={busy} aria-label={`Eliminar ${producto.nombre}`} title="Eliminar producto" onClick={() => onDelete(producto)}><Icon name="trash" size={18} /></button>
      </div></td>
    </tr>)}</tbody>
  </table></div>;
}

```

## src/components/StockBadge.tsx

```tsx
export default function StockBadge({ stock }: { stock: number }) {
  const state = stock === 0 ? 'empty' : stock <= 5 ? 'low' : 'available';
  return <span className={`stock-badge ${state}`}><span />{stock === 0 ? 'Sin stock' : stock <= 5 ? 'Stock bajo' : 'Disponible'}</span>;
}

```

## src/components/StockDialog.tsx

```tsx
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

```

## src/pages/ProductosPage.tsx

```tsx
import { useEffect, useState } from 'react';
import type { Producto, ProductoInput } from '../types/Producto';
import * as service from '../services/productosService';
import Icon from '../components/Icon';
import Dialog from '../components/Dialog';
import ProductoForm from '../components/ProductoForm';
import ProductosTable from '../components/ProductosTable';
import StockDialog from '../components/StockDialog';

type Modal = { type:'create' } | { type:'edit' | 'delete'; producto:Producto } | { type:'stock'; producto:Producto; direction:1|-1 };
export default function ProductosPage() {
  const [productos,setProductos] = useState<Producto[]>([]);
  const [search,setSearch] = useState('');
  const [revision,setRevision] = useState(0);
  const [loading,setLoading] = useState(true);
  const [loaded,setLoaded] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [modal,setModal] = useState<Modal | null>(null);
  const [modalError,setModalError] = useState('');
  const [lastSync,setLastSync] = useState('');
  const [architecture,setArchitecture] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try {
        const data = await service.getProductos(search,controller.signal);
        if (!controller.signal.aborted) {
          setProductos(data); setLoaded(true);
          setLastSync(new Date().toLocaleTimeString('es-AR'));
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No pudimos cargar el inventario.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    },search ? 250 : 0);
    return () => { controller.abort(); clearTimeout(timer); };
  },[search,revision]);

  function open(next: Modal) { setModalError(''); setNotice(''); setModal(next); }
  function refresh() { setRevision(old => old+1); }
  async function mutation(action: () => Promise<unknown>, message: string) {
    setBusy(true); setNotice('');
    try {
      await action(); setModal(null); setNotice(message); refresh();
    } finally { setBusy(false); }
  }
  async function save(data: ProductoInput) {
    if (modal?.type === 'edit') {
      await mutation(() => service.actualizarProducto(modal.producto.id,{...data,expected_stock:modal.producto.stock}),'Producto actualizado correctamente.');
    } else { await mutation(() => service.crearProducto(data),'Producto agregado correctamente.'); }
  }
  const total = productos.length;
  const low = productos.filter(p => p.stock > 0 && p.stock <= 5).length;
  const empty = productos.filter(p => p.stock === 0).length;
  const units = productos.reduce((sum,p) => sum+p.stock,0);
  const display = (value: number) => loaded ? value.toLocaleString('es-AR') : '—';

  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner">
      <a className="brand" href="/" aria-label="Control de Stock, inicio"><span className="brand-mark"><Icon name="box" size={23} /></span><span>stock<span className="brand-dot">.</span><small>CONTROL DE INVENTARIO</small></span></a>
      <nav aria-label="Navegación principal"><button className={!architecture ? 'nav-button active' : 'nav-button'} onClick={() => setArchitecture(false)}>Inventario</button><button className={architecture ? 'nav-button active' : 'nav-button'} onClick={() => setArchitecture(true)}>Arquitectura</button></nav>
      <span className="project-label">PROYECTO ACADÉMICO</span>
    </div></header>
    <main className="main-content">
      <div className="breadcrumb">Espacio de trabajo <span>/</span> <strong>Inventario</strong></div>
      <section className="page-heading"><div><span className="eyebrow">TODO EN SU LUGAR</span><h1>Control de Stock</h1><p>Gestioná tus productos. Mantené tu inventario al día.</p></div><button className="button primary" disabled={busy} onClick={() => open({type:'create'})}><Icon name="plus" />Agregar producto</button></section>
      {architecture && <section className="architecture-panel"><h2>Una operación, una función Serverless</h2><p>React envía HTTP → Vercel ejecuta la función → Supabase accede a PostgreSQL → la función devuelve JSON → React actualiza la pantalla.</p><p>La ejecución del handler termina al responder. La base de datos conserva los datos entre solicitudes. El backend no incluye un servidor propio permanente.</p></section>}
      <section className="stats-grid" aria-label={search ? 'Resumen de los resultados de búsqueda' : 'Resumen del inventario'}>
        <article className="stat-card"><span className="stat-label">Productos {search && 'en búsqueda'}<span className="stat-icon"><Icon name="box" /></span></span><strong>{display(total)}</strong><p>Referencias en el listado</p></article>
        <article className="stat-card"><span className="stat-label">Unidades totales<span className="stat-icon"><Icon name="plus" /></span></span><strong>{display(units)}</strong><p>Stock de los productos mostrados</p></article>
        <article className="stat-card warning"><span className="stat-label">Stock bajo<span className="stat-icon"><Icon name="alert" /></span></span><strong>{display(low)}</strong><p>Entre 1 y 5 unidades</p></article>
        <article className="stat-card out"><span className="stat-label">Sin stock<span className="stat-icon"><Icon name="box" /></span></span><strong>{display(empty)}</strong><p>Productos para reponer</p></article>
      </section>
      {notice && <div className="message success" role="status"><Icon name="check" />{notice}<button className="icon-button" aria-label="Cerrar aviso" onClick={() => setNotice('')}><Icon name="close" size={16} /></button></div>}
      {error && <div className="message error" role="alert"><Icon name="alert" /><span>{error}{loaded && ' El listado conserva los últimos datos consultados.'}</span><button className="text-button" onClick={refresh}>Reintentar</button></div>}
      {!loading && !error && (low > 0 || empty > 0) && <div className="stock-alert"><Icon name="alert" size={18} /><span><strong>Revisá tu inventario.</strong> {low} producto(s) con stock bajo y {empty} sin stock en este listado.</span></div>}
      <section className="inventory-panel" aria-label="Productos" aria-busy={loading}>
        <div className="inventory-header"><div><h2>Tu inventario <span className="count-badge">{display(total)}</span></h2><p>{search ? 'Resultados de la búsqueda por nombre' : 'Todos tus productos en un solo lugar'}</p></div><div className="inventory-tools"><label className="search-field"><Icon name="search" size={19} /><span className="sr-only">Buscar productos por nombre</span><input type="search" placeholder="Buscar por nombre…" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} /></label><button className="icon-button refresh-button" aria-label="Actualizar inventario" title="Actualizar inventario" disabled={loading || busy} onClick={refresh}><Icon name="refresh" /></button></div></div>
        {loading ? <div className="empty-state" role="status"><span className="spinner" /><h3>Consultando inventario…</h3><p>Estamos cargando los productos.</p></div>
          : productos.length > 0 ? <ProductosTable productos={productos} busy={busy} onEdit={producto => open({type:'edit',producto})} onStock={(producto,direction) => open({type:'stock',producto,direction})} onDelete={producto => open({type:'delete',producto})} />
          : <div className="empty-state"><span className="empty-icon"><Icon name={error ? 'alert' : 'box'} size={36} /></span><h3>{error ? 'Inventario no disponible' : search ? 'No encontramos productos' : 'Tu inventario empieza acá'}</h3><p>{error ? 'Reintentá la consulta cuando el backend esté disponible.' : search ? 'Probá con otro nombre o limpiá la búsqueda.' : 'Agregá tu primer producto para empezar a controlar el stock.'}</p>{!error && !search && <button className="button secondary" onClick={() => open({type:'create'})}><Icon name="plus" />Agregar primer producto</button>}</div>}
        <div className="inventory-footer"><span>{search ? 'Resumen limitado a tu búsqueda' : 'Precio expresado en pesos argentinos'}</span><span>{lastSync ? 'Última consulta: '+lastSync : 'Sin consulta confirmada'}</span></div>
      </section>
      <footer className="page-footer"><span>Control de Stock <span>·</span> Taller de Lenguajes de Programación IV</span><span>React <span>→</span> Vercel Functions <span>→</span> PostgreSQL</span></footer>
    </main>
    {modal?.type === 'create' && <ProductoForm busy={busy} onSubmit={save} onClose={() => setModal(null)} />}
    {modal?.type === 'edit' && <ProductoForm producto={modal.producto} busy={busy} onSubmit={save} onClose={() => setModal(null)} />}
    {modal?.type === 'stock' && <StockDialog producto={modal.producto} direction={modal.direction} busy={busy} onClose={() => setModal(null)} onSubmit={delta => mutation(() => service.actualizarStock(modal.producto.id,delta),'Stock actualizado correctamente.')} />}
    {modal?.type === 'delete' && <Dialog title="Eliminar producto" subtitle="Esta acción elimina el registro del inventario." busy={busy} onClose={() => setModal(null)}><div className="delete-content">{modalError && <div className="message error" role="alert">{modalError}</div>}<p>¿Querés eliminar <strong>{modal.producto.nombre}</strong>?</p><p>Su información y stock dejarán de estar disponibles.</p><div className="dialog-footer"><button className="button secondary" disabled={busy} onClick={() => setModal(null)}>Cancelar</button><button className="button danger" disabled={busy} onClick={async () => { setModalError(''); try { await mutation(() => service.eliminarProducto(modal.producto.id),'Producto eliminado correctamente.'); } catch (cause) { setModalError(cause instanceof Error ? cause.message : 'No pudimos eliminar el producto.'); } }}><Icon name="trash" />{busy ? 'Eliminando…' : 'Eliminar producto'}</button></div></div></Dialog>}
  </div>;
}

```

## src/App.tsx

```tsx
import ProductosPage from './pages/ProductosPage';

export default function App() { return <ProductosPage />; }

```

## src/styles.css

```css
:root {
  font-family: Inter, "Segoe UI", system-ui, -apple-system, sans-serif;
  color: #253a35; background: #f5f7f5; font-synthesis: none;
  --green: #18584a; --muted: #77837d; --line: #e7ebe7;
}
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; }
button, input, textarea { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .45; }
button, a, input, textarea { -webkit-tap-highlight-color: transparent; }
:focus-visible { outline: 3px solid #73bdae; outline-offset: 3px; }
a { color: inherit; text-decoration: none; }
h1, h2, h3, p { margin: 0; }
.topbar { background: #fff; border-bottom: 1px solid var(--line); }
.topbar-inner { max-width: 1280px; padding: 0 40px; margin: auto; min-height: 88px; display: flex; align-items: center; gap: 58px; }
.brand { display: flex; align-items: center; gap: 11px; font-size: 27px; font-weight: 800; letter-spacing: -1.1px; }
.brand-mark { display: grid; place-items: center; background: var(--green); color: #fff; width: 43px; height: 43px; border-radius: 12px; }
.brand small { display: block; font-size: 8px; letter-spacing: 1.5px; font-weight: 600; color: #7c8983; margin-top: 0; }
.brand-dot { color: #439b76; }
.topbar nav { display: flex; align-self: stretch; gap: 26px; }
.nav-button { border: 0; background: transparent; font-size: 13px; color: #7b8780; border-bottom: 2px solid transparent; padding: 0 2px; }
.nav-button.active { color: var(--green); border-bottom-color: var(--green); font-weight: 650; }
.project-label { margin-left: auto; font-size: 10px; font-weight: 650; letter-spacing: 1px; color: #829087; border: 1px solid var(--line); border-radius: 5px; padding: 8px 11px; }
.main-content { max-width: 1280px; margin: auto; padding: 31px 40px; }
.breadcrumb { font-size: 11px; color: #909b94; display: flex; gap: 12px; align-items: center; margin-bottom: 35px; }
.breadcrumb strong { font-weight: 500; color: #576860; }
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 30px; }
.eyebrow { display: block; color: #4c806e; font-weight: 650; letter-spacing: 2px; font-size: 9px; margin-bottom: 10px; }
h1 { font-size: clamp(28px, 3vw, 37px); font-weight: 700; letter-spacing: -1.2px; line-height: 1.2; }
.page-heading p { color: var(--muted); font-size: 13px; margin-top: 10px; }
.button { border: 1px solid transparent; border-radius: 8px; padding: 12px 17px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; transition: background .15s, transform .15s; }
.button:active { transform: translateY(1px); }
.primary { color: white; background: var(--green); box-shadow: 0 3px 5px #18584a13; }
.primary:hover:not(:disabled) { background: #104235; }
.secondary { background: white; color: #4c6257; border-color: #dce4dd; }
.secondary:hover:not(:disabled) { background: #f4f7f4; }
.danger { background: #c34848; color: white; }
.danger:hover:not(:disabled) { background: #a93232; }
.stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 17px; margin-bottom: 27px; }
.stat-card { padding: 20px 21px 19px; background: #fff; border: 1px solid var(--line); border-radius: 11px; box-shadow: 0 2px 3px #253a3502; }
.stat-label { display: flex; align-items: center; justify-content: space-between; color: #77847b; font-size: 11px; gap: 8px; }
.stat-icon { color: #5b8c73; background: #f0f5f0; display: grid; place-items: center; width: 33px; height: 33px; border-radius: 8px; }
.stat-card > strong { font-size: 32px; font-weight: 650; display: block; letter-spacing: -1px; margin: 4px 0 8px; font-variant-numeric: tabular-nums; }
.stat-card p { color: #929c95; font-size: 10px; }
.warning .stat-icon { background: #fff6e8; color: #b88932; }
.out .stat-icon { background: #fff0ef; color: #b6706b; }
.stock-alert { display: flex; gap: 10px; align-items: center; background: #fbf5e9; border: 1px solid #eee4c9; border-radius: 8px; color: #95783e; font-size: 11px; padding: 13px 16px; margin-bottom: 22px; }
.stock-alert strong { font-weight: 650; }
.inventory-panel { border: 1px solid var(--line); background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px #253a3502; }
.inventory-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 24px; }
.inventory-header h2 { display: flex; gap: 9px; align-items: center; font-size: 16px; font-weight: 650; letter-spacing: -.3px; }
.count-badge { background: #f0f4f0; color: #6e8674; border-radius: 5px; padding: 3px 7px; font-size: 10px; font-weight: 500; }
.inventory-header p { color: #909a93; font-size: 11px; margin-top: 7px; }
.inventory-tools { display: flex; align-items: center; gap: 10px; }
.search-field { display: flex; align-items: center; gap: 9px; padding: 0 12px; border: 1px solid #e4e9e4; border-radius: 7px; background: #fbfcfb; color: #97a198; }
.search-field input { border: 0; background: transparent; width: 225px; min-height: 40px; outline-offset: 0; font-size: 11px; color: #30483d; }
.search-field input::placeholder { color: #959f97; }
.icon-button { width: 34px; height: 34px; display: inline-flex; justify-content: center; align-items: center; border: 1px solid transparent; border-radius: 6px; background: transparent; color: #829087; flex-shrink: 0; }
.icon-button:hover:not(:disabled) { color: var(--green); background: #edf5ee; }
.refresh-button { height: 41px; width: 41px; border-color: #e4e9e4; }
.table-scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; min-width: 850px; text-align: left; }
thead { background: #f9fbf9; border-top: 1px solid #f0f3ef; border-bottom: 1px solid var(--line); }
th { color: #8a958d; font-size: 10px; font-weight: 550; padding: 13px 18px; }
td { padding: 18px; border-bottom: 1px solid #f0f3ef; font-size: 12px; }
th:first-child, td:first-child { padding-left: 24px; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: #fcfdfb; }
.product-cell { display: flex; align-items: center; gap: 13px; min-width: 200px; max-width: 320px; }
.product-avatar { width: 39px; height: 39px; border-radius: 9px; color: #8ba18b; background: #f1f5ed; display: grid; place-items: center; flex-shrink: 0; }
.product-cell > div:last-child { min-width: 0; }
.product-cell strong { font-size: 12px; font-weight: 600; display: block; overflow-wrap: anywhere; }
.product-cell span { display: block; font-size: 10px; color: #9ba399; margin-top: 5px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.category { font-size: 10px; color: #84917e; border: 1px solid #e9eee5; background: #f9fbf6; border-radius: 5px; display: inline-block; padding: 5px 8px; overflow-wrap: anywhere; max-width: 140px; }
.price { color: #54685a; font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.stock-number { font-weight: 600; color: #5f745f; font-variant-numeric: tabular-nums; }
.stock-number.zero { color: #c08277; }
.units { color: #a0aaa0; font-size: 10px; }
.stock-badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 5px; padding: 6px 8px; font-size: 10px; white-space: nowrap; }
.stock-badge > span { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.available { color: #528567; background: #eef7ef; }
.low { color: #b1853e; background: #fff6e6; }
.empty { color: #c0746c; background: #fff0ed; }
.row-actions { display: flex; gap: 1px; justify-content: flex-end; }
.actions-heading { text-align: right; padding-right: 36px; }
.danger-icon:hover:not(:disabled) { color: #b94f48; background: #fdf0ee; }
.inventory-footer { border-top: 1px solid var(--line); background: #fdfefd; padding: 16px 24px; color: #99a198; font-size: 10px; display: flex; justify-content: space-between; gap: 12px; }
.page-footer { padding-top: 25px; color: #9ca59d; display: flex; justify-content: space-between; gap: 15px; font-size: 9px; }
.page-footer span span { padding: 0 5px; color: #b3beb1; }
.empty-state { min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 13px; padding: 35px 24px; border-top: 1px solid var(--line); }
.empty-state h3 { font-size: 17px; font-weight: 600; }
.empty-state p { max-width: 400px; line-height: 1.6; color: #8a978e; font-size: 12px; }
.empty-icon { width: 70px; height: 70px; border-radius: 20px; color: #89a18c; background: #f2f6ef; display: grid; place-items: center; }
.spinner { width: 28px; height: 28px; border: 3px solid #e2eee4; border-top-color: #3a8460; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.message { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 8px; margin-bottom: 18px; font-size: 12px; line-height: 1.6; }
.message .icon-button, .message .text-button { margin-left: auto; }
.message > svg { flex-shrink: 0; }
.success { background: #eaf5ee; border: 1px solid #d3e8da; color: #387356; }
.error { background: #fff0ee; border: 1px solid #f1d9d4; color: #a5594d; }
.text-button { background: transparent; color: inherit; border: 0; text-decoration: underline; padding: 6px; font-size: 11px; }
.architecture-panel { border: 1px solid #d9e7da; background: #edf5ee; border-radius: 10px; padding: 22px; margin-bottom: 24px; }
.architecture-panel h2 { font-size: 17px; margin-bottom: 12px; }
.architecture-panel p { font-size: 12px; line-height: 1.8; color: #648070; margin-top: 6px; }
.dialog { border: 1px solid #e1e9df; border-radius: 15px; padding: 0; width: min(520px, calc(100vw - 32px)); max-height: calc(100dvh - 40px); color: #30463a; box-shadow: 0 20px 90px #132f3526; }
.dialog::backdrop { background: #1c342b65; backdrop-filter: blur(3px); }
.dialog-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 26px 26px 20px; border-bottom: 1px solid var(--line); gap: 12px; }
.dialog-header h2 { font-size: 20px; letter-spacing: -.5px; }
.dialog-header p { font-size: 12px; color: #89978c; margin-top: 8px; line-height: 1.5; }
.product-form, .delete-content { padding: 23px 26px 26px; }
.product-form label { display: block; font-size: 12px; font-weight: 550; margin-bottom: 17px; }
.product-form label input, .product-form textarea { display: block; margin-top: 8px; width: 100%; border: 1px solid #dfe7dd; padding: 11px 12px; border-radius: 7px; background: #fcfdfb; color: #405640; font-size: 13px; font-weight: 400; }
.product-form input::placeholder, .product-form textarea::placeholder { color: #acb4a7; }
.product-form textarea { resize: vertical; min-height: 85px; }
.required { color: #9e7361; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-hint { font-size: 11px; line-height: 1.6; color: #8b9786; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
.stock-current { background: #f1f6ef; border-radius: 8px; padding: 16px; font-size: 12px; color: #708365; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 10px; }
.stock-current strong { color: #4b7544; font-size: 22px; }
.stock-current small { font-size: 11px; font-weight: 400; }
.delete-content p { font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.delete-content p + p { color: #96a08e; font-size: 12px; margin-top: 6px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 960px) {
  .topbar-inner { padding: 0 24px; gap: 36px; }
  .main-content { padding: 25px 24px; }
  .stats-grid { gap: 12px; }
  .stat-card { padding: 17px 15px; }
  .search-field input { width: 180px; }
  .project-label { display: none; }
}
@media (max-width: 700px) {
  .topbar-inner { min-height: 76px; padding: 0 18px; justify-content: space-between; gap: 12px; }
  .topbar nav { gap: 16px; }
  .nav-button { font-size: 11px; }
  .brand { font-size: 24px; }
  .brand small { font-size: 7px; }
  .main-content { padding: 24px 18px; }
  .breadcrumb { margin-bottom: 25px; }
  .page-heading { align-items: flex-start; flex-direction: column; gap: 18px; margin-bottom: 23px; }
  .page-heading .button { width: 100%; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .stat-card p { font-size: 9px; }
  .stat-card > strong { font-size: 29px; }
  .inventory-header { padding: 20px 16px; flex-direction: column; align-items: stretch; gap: 18px; }
  .inventory-tools { width: 100%; }
  .search-field { flex: 1; min-width: 0; }
  .search-field input { width: 100%; min-width: 0; }
  .inventory-footer { padding: 15px 16px; flex-direction: column; gap: 6px; }
  .page-footer { flex-direction: column; line-height: 1.8; }
  .stock-alert { align-items: flex-start; line-height: 1.6; }
  .stock-alert > svg { flex-shrink: 0; margin-top: 2px; }
  .dialog-header { padding: 23px 20px 18px; }
  .product-form, .delete-content { padding: 20px; }
  table, tbody { display: block; min-width: 0; }
  thead { display: none; }
  tbody tr { display: grid; grid-template-columns: 1fr 1fr; padding: 12px 16px; border-top: 1px solid var(--line); }
  td, td:first-child { border: 0; padding: 8px 0; }
  td:first-child, td:last-child { grid-column: 1 / -1; }
  td[data-label]::before { content: attr(data-label); display: block; font-size: 10px; color: #748577; margin-bottom: 7px; }
  .product-cell { max-width: none; }
  .row-actions { justify-content: flex-start; gap: 10px; border-top: 1px solid var(--line); padding-top: 10px; }
  .row-actions .icon-button { width: 44px; height: 44px; border-color: #e4e9e4; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }

```
