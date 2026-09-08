-- One-time migration: treat all existing email accounts as verified.
-- This does not change passwords or profile data.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email is not null
  and email_confirmed_at is null;
