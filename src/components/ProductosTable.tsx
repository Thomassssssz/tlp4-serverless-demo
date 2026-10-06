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
