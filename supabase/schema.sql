-- CORE Fellowship: database setup.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
--
-- Every table has Row Level Security on and no policies, so the
-- public (anon) key can't read or write anything. Only the site's
-- server, using the service_role key, can.

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  name text,
  email text,
  data jsonb not null
);

create table if not exists public.resumes (
  id uuid primary key,
  size integer,
  created_at timestamptz not null default now()
);

-- Private portal links: token → application.
create table if not exists public.portal_tokens (
  token text primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  application_id uuid primary key references public.applications(id) on delete cascade,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);

-- One row per booked slot. The primary key stops two people taking the
-- same slot; the unique application_id gives each student one booking.
create table if not exists public.bookings (
  slot_id text primary key,
  application_id uuid not null unique references public.applications(id) on delete cascade,
  booked_at timestamptz not null default now()
);

alter table public.applications enable row level security;
alter table public.resumes enable row level security;
alter table public.portal_tokens enable row level security;
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

-- Book or move a student's interview in one step. Returns false if the
-- slot is already taken (their old booking is kept in that case).
create or replace function public.book_slot(p_application uuid, p_slot text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from bookings where application_id = p_application;
  insert into bookings (slot_id, application_id) values (p_slot, p_application);
  return true;
exception when unique_violation then
  return false;
end;
$$;

revoke execute on function public.book_slot(uuid, text) from public, anon, authenticated;
grant execute on function public.book_slot(uuid, text) to service_role;

-- Private bucket for résumé PDFs.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Handy view for the board: one row per applicant.
create or replace view public.applicant_overview
with (security_invoker = true) as
select
  a.received_at,
  a.name,
  a.email,
  a.data ->> 'major' as major,
  a.data ->> 'gradYear' as grad_year,
  p.profile -> 'roles' as roles,
  p.profile -> 'availability' as availability,
  b.slot_id as interview_slot,
  a.id
from public.applications a
left join public.profiles p on p.application_id = a.id
left join public.bookings b on b.application_id = a.id
order by a.received_at desc;
