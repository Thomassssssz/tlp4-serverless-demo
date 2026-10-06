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
