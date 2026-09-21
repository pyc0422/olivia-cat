-- Guests are visible in their own roster box instead of disappearing.
alter table if exists public.profiles
  drop constraint if exists profiles_member_group_check;

alter table if exists public.profiles
  add constraint profiles_member_group_check
  check (member_group in ('members', 'new_members', 'guests'));

-- Only Izzy and Olivia may award Kitty Bucks to another profile.
create or replace function public.award_kitty_bucks(recipient_id uuid, amount integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
  new_balance integer;
begin
  if amount < 1 or amount > 50 then
    raise exception 'Kitty Buck award must be between 1 and 50';
  end if;

  select name into sender_name from public.profiles where id = auth.uid();
  if sender_name not in ('Izzy', 'Olivia') then
    raise exception 'Only Izzy or Olivia can award Kitty Bucks';
  end if;

  update public.profiles
  set kitty_bucks = kitty_bucks + amount,
      updated_at = now()
  where id = recipient_id
  returning kitty_bucks into new_balance;

  if new_balance is null then
    raise exception 'Recipient profile not found';
  end if;

  return new_balance;
end;
$$;

grant execute on function public.award_kitty_bucks(uuid, integer) to authenticated;
