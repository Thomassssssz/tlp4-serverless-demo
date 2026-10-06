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
