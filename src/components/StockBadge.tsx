export default function StockBadge({ stock }: { stock: number }) {
  const state = stock === 0 ? 'empty' : stock <= 5 ? 'low' : 'available';
  return <span className={`stock-badge ${state}`}><span />{stock === 0 ? 'Sin stock' : stock <= 5 ? 'Stock bajo' : 'Disponible'}</span>;
}
