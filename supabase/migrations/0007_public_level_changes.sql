-- Allow any signed-in Cat Club member to move a profile on the ladder,
-- without granting permission to edit other profile fields.
create or replace function public.set_profile_level(target_id uuid, next_level text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if next_level not in ('Noob', 'Kitten', 'Warrior', 'Guard', 'Queen', 'Trainer', 'Leader') then
    raise exception 'Invalid Cat Club level';
  end if;

  update public.profiles
  set level = next_level,
      updated_at = now()
  where id = target_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found';
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.set_profile_level(uuid, text) to authenticated;
