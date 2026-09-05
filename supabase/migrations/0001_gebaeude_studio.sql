-- Studio / Wahlsystem, Phase 1 (05.09.2026): ein Gebaeude wird einmal angelegt,
-- jedes Tool haengt seinen Zustand als Knoten daran. Owner dieser Migration ist
-- der Tools Hub; live eingespielt per Supabase-MCP (apply_migration) auf
-- Projekt gsmuqvjyfjtjbbxqmfgt. Zugriff ausschliesslich ueber SECURITY-DEFINER-
-- RPCs mit auth.uid()-Pruefung (RLS an, keine Policies) -- dasselbe Muster wie
-- saved_results_*. saved_results bleibt als Uebergang fuer die Tools 2/3/4/5/8
-- bestehen (Stand 05.09.2026: 0 Zeilen, keine Datenmigration noetig).

create table if not exists public.gebaeude (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kundenname text not null check (length(trim(kundenname)) between 1 and 200),
  objektadresse text not null check (length(trim(objektadresse)) between 1 and 300),
  -- Kanonische Fachdaten (lib/gebaeude/stammdaten.ts in jedem Tool), schema_version im JSON.
  stammdaten jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gebaeude_user_idx on public.gebaeude (user_id, updated_at desc);
alter table public.gebaeude enable row level security;

create table if not exists public.gebaeude_knoten (
  id uuid primary key default gen_random_uuid(),
  gebaeude_id uuid not null references public.gebaeude(id) on delete cascade,
  tool_slug text not null check (length(tool_slug) between 1 and 60),
  -- Kompletter Eingabezustand des Tools (wird beim Laden 1:1 wiederhergestellt).
  eingaben jsonb not null default '{}'::jsonb,
  -- 3-6 Kennzahlen fuer die Gebaeudekarte im Studio (z. B. heizlast_kw).
  ergebnis_zusammenfassung jsonb not null default '{}'::jsonb,
  -- Canvas-Position (Phase 4), frei.
  position jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gebaeude_id, tool_slug)
);
alter table public.gebaeude_knoten enable row level security;

-- ---------------------------------------------------------------------------
-- Eigene Gebaeude inkl. angehaengter Knoten (Kurzform) fuer Listen im Hub/Tool.
create or replace function public.gebaeude_list()
returns table (
  id uuid, kundenname text, objektadresse text, stammdaten jsonb,
  created_at timestamptz, updated_at timestamptz, knoten jsonb
)
language sql stable security definer set search_path = public as $$
  select g.id, g.kundenname, g.objektadresse, g.stammdaten, g.created_at, g.updated_at,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'id', k.id, 'tool_slug', k.tool_slug, 'updated_at', k.updated_at,
             'ergebnis_zusammenfassung', k.ergebnis_zusammenfassung
           ) order by k.updated_at desc)
           from gebaeude_knoten k where k.gebaeude_id = g.id
         ), '[]'::jsonb) as knoten
  from gebaeude g
  where g.user_id = auth.uid()
  order by g.updated_at desc;
$$;

-- Ein Gebaeude komplett (Stammdaten + alle Knoten mit Eingaben) -- fuer ?gebaeude=<id>.
create or replace function public.gebaeude_get(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select jsonb_build_object(
    'gebaeude', to_jsonb(g),
    'knoten', coalesce((select jsonb_agg(to_jsonb(k) order by k.updated_at desc)
                        from gebaeude_knoten k where k.gebaeude_id = g.id), '[]'::jsonb)
  ) into v
  from gebaeude g where g.id = p_id and g.user_id = auth.uid();
  if v is null then raise exception 'Gebäude nicht gefunden'; end if;
  return v;
end $$;

-- Anlegen (p_id null) oder Aktualisieren. Stammdaten werden gemischt (jsonb ||):
-- ein Tool ergaenzt nur die Felder, die es kennt, und ueberschreibt keine fremden.
create or replace function public.gebaeude_upsert(
  p_id uuid default null,
  p_kundenname text default null,
  p_objektadresse text default null,
  p_stammdaten jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_count int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_stammdaten is null or jsonb_typeof(p_stammdaten) <> 'object' then raise exception 'Stammdaten müssen ein Objekt sein'; end if;
  if pg_column_size(p_stammdaten) > 20000 then raise exception 'Stammdaten zu groß'; end if;

  if p_id is null then
    if p_kundenname is null or length(trim(p_kundenname)) = 0 then raise exception 'Kundenname fehlt'; end if;
    if p_objektadresse is null or length(trim(p_objektadresse)) = 0 then raise exception 'Objektadresse fehlt'; end if;
    select count(*) into v_count from gebaeude where user_id = auth.uid();
    if v_count >= 50 then raise exception 'Limit von 50 Gebäuden erreicht'; end if;
    insert into gebaeude (user_id, kundenname, objektadresse, stammdaten)
    values (auth.uid(), trim(p_kundenname), trim(p_objektadresse), p_stammdaten)
    returning id into v_id;
    return v_id;
  end if;

  update gebaeude set
    kundenname = coalesce(nullif(trim(p_kundenname), ''), kundenname),
    objektadresse = coalesce(nullif(trim(p_objektadresse), ''), objektadresse),
    stammdaten = stammdaten || p_stammdaten,
    updated_at = now()
  where id = p_id and user_id = auth.uid()
  returning id into v_id;
  if v_id is null then raise exception 'Gebäude nicht gefunden'; end if;
  return v_id;
end $$;

create or replace function public.gebaeude_delete(p_id uuid)
returns void
language sql security definer set search_path = public as $$
  delete from gebaeude where id = p_id and user_id = auth.uid();
$$;

-- Knoten eines Tools anlegen/ersetzen (ein Knoten je Tool und Gebaeude).
create or replace function public.gebaeude_knoten_upsert(
  p_gebaeude_id uuid,
  p_tool_slug text,
  p_eingaben jsonb,
  p_ergebnis jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from gebaeude g where g.id = p_gebaeude_id and g.user_id = auth.uid()) then
    raise exception 'Gebäude nicht gefunden';
  end if;
  if p_eingaben is null or jsonb_typeof(p_eingaben) <> 'object' then raise exception 'Eingaben müssen ein Objekt sein'; end if;
  if pg_column_size(p_eingaben) > 40000 then raise exception 'Eingaben zu groß'; end if;
  if p_ergebnis is null or jsonb_typeof(p_ergebnis) <> 'object' then raise exception 'Ergebnis muss ein Objekt sein'; end if;
  if pg_column_size(p_ergebnis) > 10000 then raise exception 'Ergebnis zu groß'; end if;
  if length(trim(p_tool_slug)) = 0 then raise exception 'Tool fehlt'; end if;

  insert into gebaeude_knoten (gebaeude_id, tool_slug, eingaben, ergebnis_zusammenfassung)
  values (p_gebaeude_id, trim(p_tool_slug), p_eingaben, p_ergebnis)
  on conflict (gebaeude_id, tool_slug) do update
    set eingaben = excluded.eingaben,
        ergebnis_zusammenfassung = excluded.ergebnis_zusammenfassung,
        updated_at = now()
  returning id into v_id;
  update gebaeude set updated_at = now() where id = p_gebaeude_id;
  return v_id;
end $$;

create or replace function public.gebaeude_knoten_delete(p_id uuid)
returns void
language sql security definer set search_path = public as $$
  delete from gebaeude_knoten k
  using gebaeude g
  where k.id = p_id and g.id = k.gebaeude_id and g.user_id = auth.uid();
$$;

-- Admin-Sicht (nur role = 'admin'), analog admin_list_saved_results.
create or replace function public.admin_list_gebaeude(p_limit int default 200, p_user_id uuid default null)
returns table (
  id uuid, user_id uuid, kundenname text, objektadresse text,
  created_at timestamptz, updated_at timestamptz, knoten_anzahl bigint, tool_slugs text[]
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'nicht berechtigt';
  end if;
  return query
    select g.id, g.user_id, g.kundenname, g.objektadresse, g.created_at, g.updated_at,
           (select count(*) from gebaeude_knoten k where k.gebaeude_id = g.id),
           (select coalesce(array_agg(k.tool_slug order by k.tool_slug), '{}') from gebaeude_knoten k where k.gebaeude_id = g.id)
    from gebaeude g
    where p_user_id is null or g.user_id = p_user_id
    order by g.updated_at desc
    limit p_limit;
end $$;

revoke all on function public.gebaeude_list() from public;
revoke all on function public.gebaeude_get(uuid) from public;
revoke all on function public.gebaeude_upsert(uuid, text, text, jsonb) from public;
revoke all on function public.gebaeude_delete(uuid) from public;
revoke all on function public.gebaeude_knoten_upsert(uuid, text, jsonb, jsonb) from public;
revoke all on function public.gebaeude_knoten_delete(uuid) from public;
revoke all on function public.admin_list_gebaeude(int, uuid) from public;
grant execute on function public.gebaeude_list() to authenticated;
grant execute on function public.gebaeude_get(uuid) to authenticated;
grant execute on function public.gebaeude_upsert(uuid, text, text, jsonb) to authenticated;
grant execute on function public.gebaeude_delete(uuid) to authenticated;
grant execute on function public.gebaeude_knoten_upsert(uuid, text, jsonb, jsonb) to authenticated;
grant execute on function public.gebaeude_knoten_delete(uuid) to authenticated;
grant execute on function public.admin_list_gebaeude(int, uuid) to authenticated;
