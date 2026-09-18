# v57 validation and release status

Base repository: `tallgeese84/PokemonNumbers`, commit `c0176371aa8cb219e8d42b5ff150d1a41ab1f5ea` (v56).

Implemented: five reliability fixes; guided adventure; adaptive range/support/question format; active practice timer and effort celebration; parent daily/weekly analytics and history export; separate offline-safe activity upload; GitHub Actions daily report with Resend and duplicate-delivery protection.

Verification: **24 passing Node regression tests** using synthetic records, a mocked DOM for quiz generation/hints, and mocked Firebase/Resend calls. Covered idle/hidden/reward timing, pause/resume, midnight and DST dates, session breaks, help/mastery classification, later-day promotion, repeated-error support, comparable trends, idempotent session merges, cache isolation, two-error hint recovery, stale callbacks, saved-question correctness, failed-read safety, conditional-write conflict retries, email dry-run and idempotency. All shipped JavaScript parses; git diff has no whitespace errors.

Not verified: visual rendering/mobile interaction in a real browser, live Firebase rules/CORS, real email delivery, or deployment. The cloud browser cannot open the local preview under its current URL policy. No alternative browser was used to bypass that restriction.

The initial publication attempt was blocked because this repository was missing from the GitHub installation’s selected repositories. The owner has now granted repository access. Deployment and live checks are recorded in the pull request and GitHub Actions.

Email is disabled by default until the repository secrets and `POKEMATH_REPORTS_ENABLED=true` are configured. See REPORT_SETUP.md. No Gmail account was accessed, no real child activity was read, and no test email was sent.

Before release, run the tests and verify on a test browser/profile: wrong twice then correct; leave/reopen an unfinished question; request help then answer; wait 60 seconds for the pause prompt; background the app; browse collection; finish the time goal; inspect parent journal; load offline after one online visit. Check small-phone and tablet layouts. Confirm activity sync on Jonah's device and then validate email with dry-run before a real send.
