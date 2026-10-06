-- Ejecutar en SQL Editor de Supabase. No elimina datos existentes.
begin;

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  descripcion text not null default '' check (char_length(descripcion) <= 1000),
  categoria text not null default '' check (char_length(categoria) <= 80),
  precio numeric(12, 2) not null check (precio >= 0),
  stock integer not null default 0 check (stock >= 0),
  fecha_creacion timestamptz not null default now()
);

alter table public.productos enable row level security;
-- El navegador no accede directamente. Solo el backend usa service_role.
revoke all on table public.productos from anon, authenticated;
grant select, insert, update, delete on table public.productos to service_role;

-- Una sola operación en PostgreSQL: evita actualizaciones perdidas.
create or replace function public.actualizar_stock(p_id uuid, p_delta integer)
returns setof public.productos
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_delta = 0 or p_delta is null then
    raise exception 'La cantidad debe ser distinta de cero' using errcode = '22023';
  end if;

  return query
    update public.productos
    set stock = (stock::bigint + p_delta)::integer
    where id = p_id
      and (stock::bigint + p_delta) between 0 and 2147483647
    returning *;

  if not found then
    if not exists (select 1 from public.productos where id = p_id) then
      raise exception 'Producto no encontrado' using errcode = 'P0002';
    end if;
    raise exception 'Stock insuficiente o límite de stock excedido' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.actualizar_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.actualizar_stock(uuid, integer) to service_role;

commit;
