-- Allow people outside the official roster to register with their own name.
-- The roster still determines the group for official Cat Club names.
alter table if exists profiles drop constraint if exists profiles_name_fkey;
alter table if exists messages drop constraint if exists messages_author_name_fkey;
alter table if exists drawings drop constraint if exists drawings_author_name_fkey;
alter table if exists videos drop constraint if exists videos_author_name_fkey;

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
