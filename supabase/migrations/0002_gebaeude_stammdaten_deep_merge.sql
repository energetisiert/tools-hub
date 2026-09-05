-- Studio Phase 2 (05.09.2026): Stammdaten rekursiv mischen. Live per Supabase-MCP
-- eingespielt. Hintergrund: jsonb || ersetzt verschachtelte Objekte als Ganzes --
-- speicherte der Heizlastrechner heizung {erzeuger, energietraeger}, fiel das
-- vom CO2-Rechner gesetzte heizung.baujahr weg. Jetzt feldweise; null im neuen
-- Wert bedeutet "keine Information".
create or replace function public.jsonb_deep_merge(a jsonb, b jsonb)
returns jsonb
language sql immutable strict as $$
  select case
    when jsonb_typeof(a) = 'object' and jsonb_typeof(b) = 'object' then
      (select coalesce(jsonb_object_agg(k, v), '{}'::jsonb)
       from (
         select k,
                case
                  when a ? k and b ? k then jsonb_deep_merge(a -> k, b -> k)
                  when b ? k then b -> k
                  else a -> k
                end as v
         from (select jsonb_object_keys(a) as k union select jsonb_object_keys(b)) keys
       ) merged
       where v is not null and jsonb_typeof(v) <> 'null')
    when jsonb_typeof(b) = 'null' then a
    else b
  end
$$;

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
    values (auth.uid(), trim(p_kundenname), trim(p_objektadresse), jsonb_deep_merge('{}'::jsonb, p_stammdaten))
    returning id into v_id;
    return v_id;
  end if;

  update gebaeude set
    kundenname = coalesce(nullif(trim(p_kundenname), ''), kundenname),
    objektadresse = coalesce(nullif(trim(p_objektadresse), ''), objektadresse),
    stammdaten = jsonb_deep_merge(stammdaten, p_stammdaten),
    updated_at = now()
  where id = p_id and user_id = auth.uid()
  returning id into v_id;
  if v_id is null then raise exception 'Gebäude nicht gefunden'; end if;
  return v_id;
end $$;

revoke all on function public.jsonb_deep_merge(jsonb, jsonb) from public;
grant execute on function public.jsonb_deep_merge(jsonb, jsonb) to authenticated;
