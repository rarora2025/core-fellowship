# CORE Fellowship: going live

Everything below the domain is built and tested on localhost against the
real Supabase project. What's left needs the domain.

## What's built

- **Apply** (`/apply/student`), one flow, about 4 minutes:
  basics → where they can work and work authorization → "Now the fun part"
  → the profile (tap-only, under three quiet topic labels: what you're good
  at, what you're into, how you like to work) → LinkedIn, resume, optional
  work link, optional referral → "That's the outline" → book.
- **Book** (`/portal/interview`): 20-minute times, one per student; move or
  cancel until 2 hours before. The database refuses a time someone else
  holds. Each time belongs to one interviewer; if two are free at once the
  student sees the time once.
- **Calendar invites**, built like LionApps': booking emails the student and
  both of you a real invite (Gmail adds it to the calendar);
  a move updates the same event, a cancel removes it. The student's email
  carries their private link so they can always get back in.
- **Portal** (`/portal`): their booked time as a ticket card, their profile
  tags, and edit, move or cancel.
- **Schedule** (`/board/schedule`): one shared calendar of CORE's
  interview times and booked conversations (Dev and Rahul are on every
  interview and both get every invite). Press Edit times, drag over the
  times you're free (in person or a Google Meet link) and save; students can
  book them straight away. Booked and past times are locked.
- **Board** (`/board`, one shared password): everyone who applied as a
  table. Search, sort, group into pools (by role, space, year, where, work
  authorization, interview status or interviewer), filter to one
  interviewer, and click anyone for their full profile, resume, LinkedIn and
  work link. Export CSV for startups. Once signed in, a "Board" link shows in
  the top bar; on the board, "Student view" goes back. On localhost
  (`npm run dev`, opened as localhost) the board is always open with no
  password, so the switch is always there while you build.
- **Supabase** project `core-fellowship`: `supabase/schema.sql`,
  `supabase/availability.sql` and `supabase/shared-times.sql` are applied.
  Resumes are in a private bucket. Nothing is readable without the server
  key. `applicant_overview` in the Table Editor is one row per applicant.

## To go live (needs the domain)

1. **Email.** In Resend (resend.com), add the domain and put the DNS records
   it shows into the domain's DNS. Make an API key.
2. **Vercel.** Import the repo, branch `student-portal` (or `main` once
   merged). Add these environment variables, then deploy:

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | `https://hokwmtusbgaoohlsxphr.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → secret key |
   | `RESEND_API_KEY` | from step 1 |
   | `MAIL_FROM` | `CORE Fellowship <noreply@THE-DOMAIN>` |
   | `BOARD_PASSWORD` | anything; share it with whoever interviews |
   | `NEXT_PUBLIC_SITE_URL` | `https://THE-DOMAIN` |

3. **Domain.** In Vercel → Settings → Domains, add it and follow the DNS
   instructions.

## Before opening applications

- Set the real interview times on the board's Schedule tab (the ones there
  now are placeholders from Dec 1 to 7). Both interviewers' addresses are
  in `interviewers` in `src/content/interviews.ts`.
- Delete the test applicants (names start with "Test Applicant", emails
  `zz-test-…@columbia.edu`) in Supabase → Table Editor → `applications`.
- Book one real test interview and check both invites arrive.
