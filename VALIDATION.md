# v59 child interface simplification

Base: `8010fdcfe8be8020917b9986f680b5838ced1871` (v58).

Implemented: three child destinations on home; one buddy and a plain background; three activity choices per page; one-column practice; compact clock and picture controls; question replay for all practice modes; adult-only progress counters; simplified pause and goal dialogs. All nine activities and existing journal records remain available.

Local verification: 25 regression tests pass. The timer exclusion test now includes the game chooser. HTML IDs are unique and all nine activity buttons are present. Browser review and final deployment verification follow publication.

---

# v58 visual refresh

Base: `8fc6907de015cae708c3100d201ac4a57990d861` (v57).

Implemented: illustrated home and activity cards; shared quieter visual theme; larger Pokémon artwork; original vector counters/trainers/tree; explicit Journal and question replay controls; seven-day journal chart; expandable parent settings; responsive arithmetic and canvas layout; separated race answer targets; reduced-motion and zoom support; parent dialog focus handling.

Verification: all 25 regression tests pass, including JavaScript parsing for the new visuals module. HTML IDs are unique and the meadow SVG parses. GitHub regression and Pages deployment succeeded for the initial v58 release.

Live browser review used synthetic activity with cloud sync disconnected. Reviewed home, arithmetic, counting, tracing, bead counter, number line, hide and seek, Wild Catch, Number Race, cards, badges, and the journal. Confirmed arithmetic accepts a correct answer and saves it, bead and hop controls respond, the journal chart contains seven calendar days, and parent settings begin collapsed. Checked 320/390-pixel phone and 768/1024-pixel tablet frames; narrow counting and journal content did not overflow, two-digit tracing stayed inside its container, and race answer rectangles did not overlap. The final polish addresses findings from this review: phone hero contrast, compact tracing choices, Journal label persistence, and badge hierarchy.

These are browser viewport checks, not a physical touch-device test. Real Firebase sync and real email delivery were not exercised. Email remains disabled.

---

# v57 validation and release status

Base repository: `tallgeese84/PokemonNumbers`, commit `c0176371aa8cb219e8d42b5ff150d1a41ab1f5ea` (v56).

Implemented: five reliability fixes; guided adventure; adaptive range/support/question format; active practice timer and effort celebration; parent daily/weekly analytics and history export; separate offline-safe activity upload; GitHub Actions daily report with Resend and duplicate-delivery protection.

Verification: **25 passing Node regression tests** using synthetic records, a mocked DOM for quiz generation/hints, and mocked Firebase/Resend calls. Covered idle/hidden/reward timing, pause/resume, midnight and DST dates, session breaks, help/mastery classification, later-day promotion, repeated-error support, comparable trends, idempotent session merges, cache isolation, two-error hint recovery, stale callbacks, saved-question correctness, failed-read safety, conditional-write conflict retries, email dry-run and idempotency. All shipped JavaScript parses; git diff has no whitespace errors.

Live browser checks passed on GitHub Pages: v57 loads; story addition recovers after two incorrect answers; helped success awards one star without a streak; the manual pause freezes the timer; the parent journal records the attempted question as helped and non-independent. The Pages deployment and GitHub regression job succeeded. Not verified: a physical tablet, live Firebase rules/CORS, and real email delivery. Local preview access remained blocked by the cloud browser URL policy; testing used the normally deployed public app.

The initial publication attempt was blocked because this repository was missing from the GitHub installation’s selected repositories. The owner has now granted repository access. Deployment and live checks are recorded in the pull request and GitHub Actions.

Email is disabled by default until the repository secrets and `POKEMATH_REPORTS_ENABLED=true` are configured. See REPORT_SETUP.md. No Gmail account was accessed, no real child activity was read, and no test email was sent.

Before release, run the tests and verify on a test browser/profile: wrong twice then correct; leave/reopen an unfinished question; request help then answer; wait 60 seconds for the pause prompt; background the app; browse collection; finish the time goal; inspect parent journal; load offline after one online visit. Check small-phone and tablet layouts. Confirm activity sync on Jonah's device and then validate email with dry-run before a real send.
