-- Some existing projects may have generated foreign-key names that differ
-- from the names used in migration 0002. Remove every roster-only FK safely.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select
      ns.nspname as schema_name,
      cls.relname as table_name,
      con.conname as constraint_name
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace ns on ns.oid = cls.relnamespace
    join pg_class referenced_cls on referenced_cls.oid = con.confrelid
    where con.contype = 'f'
      and ns.nspname = 'public'
      and referenced_cls.relname = 'allowed_members'
      and cls.relname in ('profiles', 'messages', 'drawings', 'videos')
  loop
    execute format(
      'alter table %I.%I drop constraint %I',
      constraint_row.schema_name,
      constraint_row.table_name,
      constraint_row.constraint_name
    );
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  official_group text;
  requested_name text;
begin
  requested_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '');

  select member_group into official_group
  from public.allowed_members
  where name = requested_name;

  insert into public.profiles (
    id, name, email, phone, member_group, board_visible, level,
    kitty_bucks, avatar_unlocks, avatar_color, avatar_eyes, avatar_mouth,
    avatar_clothes, avatar_accessory, last_login_at
  )
  values (
    new.id,
    coalesce(requested_name, new.email),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(official_group, 'new_members'),
    true,
    case when official_group is null then 'Noob' else coalesce(new.raw_user_meta_data ->> 'level', 'Noob') end,
    0, '{}'::jsonb, 'orange', 'round', 'smile', 'hoodie', 'none', now()
  )
  on conflict (id) do update
  set email = excluded.email,
      last_login_at = excluded.last_login_at,
      updated_at = now();

  return new;
end;
$$;
