-- CORE Fellowship: interview times live in the database, set on the
-- board's Schedule tab. Run once (after schema.sql). Safe to run again.

create table if not exists public.interview_windows (
  id uuid primary key default gen_random_uuid(),
  interviewer text not null check (interviewer in ('dev', 'rahul')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null default 'Lerner Hall',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists interview_windows_by_time on public.interview_windows (interviewer, starts_at);

alter table public.interview_windows enable row level security;
grant select, insert, update, delete on public.interview_windows to service_role;
revoke all on public.interview_windows from anon, authenticated;

-- Replace one interviewer's free times inside [p_from, p_to) in one step,
-- so a half-saved week can never happen.
create or replace function public.replace_windows(p_interviewer text, p_from timestamptz, p_to timestamptz, p_windows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from interview_windows
   where interviewer = p_interviewer and starts_at >= p_from and starts_at < p_to;
  insert into interview_windows (interviewer, starts_at, ends_at, location)
  select p_interviewer, (w->>'start')::timestamptz, (w->>'end')::timestamptz, coalesce(nullif(w->>'location', ''), 'Lerner Hall')
    from jsonb_array_elements(p_windows) w;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.replace_windows(text, timestamptz, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.replace_windows(text, timestamptz, timestamptz, jsonb) to service_role;

-- The placeholder times the site launched with (New York time), only if
-- there are none yet. Change them on the board.
insert into public.interview_windows (interviewer, starts_at, ends_at, location)
select * from (values
  ('dev',   timestamptz '2026-12-01 14:00 America/New_York', timestamptz '2026-12-01 16:00 America/New_York', 'Lerner Hall'),
  ('rahul', timestamptz '2026-12-02 18:00 America/New_York', timestamptz '2026-12-02 20:00 America/New_York', 'Lerner Hall'),
  ('dev',   timestamptz '2026-12-03 11:00 America/New_York', timestamptz '2026-12-03 13:00 America/New_York', 'Lerner Hall'),
  ('rahul', timestamptz '2026-12-04 15:00 America/New_York', timestamptz '2026-12-04 17:00 America/New_York', 'Lerner Hall'),
  ('dev',   timestamptz '2026-12-07 17:00 America/New_York', timestamptz '2026-12-07 19:00 America/New_York', 'Lerner Hall')
) as v(interviewer, starts_at, ends_at, location)
where not exists (select 1 from public.interview_windows);
