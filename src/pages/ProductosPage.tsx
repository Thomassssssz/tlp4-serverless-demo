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
