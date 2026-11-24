-- CORE Fellowship: one shared set of interview times (both Dev and Rahul
-- are on every interview). Moves existing times and bookings over.
-- Run once, after availability.sql. Safe to run again.

alter table public.interview_windows drop constraint if exists interview_windows_interviewer_check;
update public.interview_windows set interviewer = 'core' where interviewer <> 'core';
alter table public.interview_windows add constraint interview_windows_interviewer_check check (interviewer = 'core');
alter table public.interview_windows alter column interviewer set default 'core';

update public.bookings
   set slot_id = regexp_replace(slot_id, '-(dev|rahul)$', '-core')
 where slot_id ~ '-(dev|rahul)$';
