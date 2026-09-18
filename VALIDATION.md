# v58 visual refresh

Base: `8fc6907de015cae708c3100d201ac4a57990d861` (v57).

Implemented: illustrated home and activity cards; shared quieter visual theme; larger Pokémon artwork; original vector counters/trainers/tree; explicit Journal and question replay controls; seven-day journal chart; expandable parent settings; responsive arithmetic and canvas layout; separated race answer targets; reduced-motion and zoom support; parent dialog focus handling.

Initial verification: all 25 existing regression tests pass, including JavaScript parsing for the new visuals module. Live responsive review follows deployment; physical tablet and live sync remain outside this synthetic-browser check. Email remains disabled.

---

# v57 validation and release status

Base repository: `tallgeese84/PokemonNumbers`, commit `c0176371aa8cb219e8d42b5ff150d1a41ab1f5ea` (v56).

Implemented: five reliability fixes; guided adventure; adaptive range/support/question format; active practice timer and effort celebration; parent daily/weekly analytics and history export; separate offline-safe activity upload; GitHub Actions daily report with Resend and duplicate-delivery protection.

Verification: **25 passing Node regression tests** using synthetic records, a mocked DOM for quiz generation/hints, and mocked Firebase/Resend calls. Covered idle/hidden/reward timing, pause/resume, midnight and DST dates, session breaks, help/mastery classification, later-day promotion, repeated-error support, comparable trends, idempotent session merges, cache isolation, two-error hint recovery, stale callbacks, saved-question correctness, failed-read safety, conditional-write conflict retries, email dry-run and idempotency. All shipped JavaScript parses; git diff has no whitespace errors.

Live browser checks passed on GitHub Pages: v57 loads; story addition recovers after two incorrect answers; helped success awards one star without a streak; the manual pause freezes the timer; the parent journal records the attempted question as helped and non-independent. The Pages deployment and GitHub regression job succeeded. Not verified: a physical tablet, live Firebase rules/CORS, and real email delivery. Local preview access remained blocked by the cloud browser URL policy; testing used the normally deployed public app.

The initial publication attempt was blocked because this repository was missing from the GitHub installation’s selected repositories. The owner has now granted repository access. Deployment and live checks are recorded in the pull request and GitHub Actions.

Email is disabled by default until the repository secrets and `POKEMATH_REPORTS_ENABLED=true` are configured. See REPORT_SETUP.md. No Gmail account was accessed, no real child activity was read, and no test email was sent.

Before release, run the tests and verify on a test browser/profile: wrong twice then correct; leave/reopen an unfinished question; request help then answer; wait 60 seconds for the pause prompt; background the app; browse collection; finish the time goal; inspect parent journal; load offline after one online visit. Check small-phone and tablet layouts. Confirm activity sync on Jonah's device and then validate email with dry-run before a real send.
