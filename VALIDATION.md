# v74 English check

88 Node tests pass (8 new): stuck-Build regression (fails on v73, passes now), check order and early stopping, a non-responding child finishing as a Sound explorer without seeing words, sound batches of three, words gated on known sounds, pre-reading gate, re-teaching missed sounds, and redo surviving sync. Simulated children (knows nothing / listening only / a few letters / half the letters / strong) finish in 15 / 25 / 35 / 46 / 58 items. Headless browser walk-through as a beginner: check → first sounds → shapes, writing, listening and letter games, no page errors and no screen without a tappable way forward. Not checked on the tablet itself.

---

# v70 fox

83 Node tests pass (3 new: tail growth is monotone and reaches nine only when both paths finish; purchases cannot overspend and wearables toggle free; cross-device merge keeps leaves, purchases and seen tails). Headless Chromium with software WebGL rendered the den at 1, 4 and 9 tails from several angles, a treat, wearing an item and drag-to-turn, with no page errors. Not checked on a physical tablet's GPU.

---

# v69 maths path

Base: v68. Adds `math-path-core.js`, `math-path-ui.js`, `math-path.css`; Play's maths slots ask the path.

Local: 80 Node tests pass (10 new). Every generator (23 question types, all levels, 300 samples each) is checked against an independent solver that reads only what the child sees; P1 limits (sums ≤100, products ≤40, division ≤20, money, 5-minute clock) and renaming/no-renaming levels are checked. Mastery requires varied first-try answers; repeating one fact or helped answers cannot level up. Delegated skills read real foundation histories. Unlocking, placement with prerequisites, routing (check → frontier → existing games → review slot), state merge and redo are covered. A fake-DOM run of the real UI checks independent vs helped credit, help display after two misses, and the one-try maths check.

Browser (headless Chromium, synthetic data, speech stubbed): every question type and its help rendered at 390 px; Play drove reading block → maths check → maths block → reading block with no page errors; Gyms and the grown-ups panel at 820 px. Not checked: a physical tablet, real voices, Firebase sync of the new `mathPath` field.

---

# v68 reading wing

Base: `e2b43b0` (v67). Adds `reading-data.js`, `reading-core.js`, `reading-ui.js`, `reading.css`; Play interleaves reading and maths.

Local: 70 Node tests pass (15 new). New coverage: decodability of all 18 routes' words, books and readable names; segmentation (teams, split digraphs, -s/-ed sounds, syllables); Dolch coverage; item boxes (same-day cap, later-day mastery, help resets); route gates; placement staircase; review of placed routes; option/answer integrity for every activity and route; state merging and session-derived passes; readiness pace. A fake-DOM run of the real UI checks that Read it never speaks the word before an answer, that help is recorded and non-independent, that the reading check gives one try without fading, that books record page help then ask a question, and that legacy import is one-off. Existing mission tests were updated for interleaved Play and the cache-name test for v68.

Browser (headless Chromium, synthetic data, speech stubbed): placement through route 12, a fresh child through route 1 into route 2, and every activity type rendered at 360, 390 and 820 px with no page errors. Not checked: a physical tablet, real speech voices, microphone recording, Firebase sync of the new `reading` field.

---

# v67 bounded counting warm-up

The standalone Count game previously repeated indefinitely and bypassed the mixed foundation sequence. It now moves into that sequence after three completed counting questions on the current Madison calendar day. The limit includes helped completions, persists through saved session history, and does not treat counting success as mastery of addition or subtraction. The game tile is labeled Warm-up. A new mixed cycle begins with taking away, addition, and covered prediction, while retaining its 60% part-whole/subtraction, 25% addition/patterns, and 15% equal-groups balance. Focused Add and Take games remain available.

Validation: 54 regression tests pass, including the real routing handlers, helped warm-ups, re-entering Games, saved-history reloads, day boundaries, malformed sequence positions, and the existing visual foundations and Drive mirror checks. Shipped JavaScript parses and the diff passes whitespace checks. Browser interaction could not be rechecked in this session because the browser connection remained unavailable; no child records or connection settings were modified for testing.

# v60 personalized avatar

Base: `72d66a24f164c1fd5abc1f56c6eb37ddf0d8027b` (v59).

Jonah’s avatar is confirmed by the `AV_IMG.jonah` mapping in ChineseLearningP1-3. The matching original `jonah_old_avatar.webp` is copied unchanged as a local asset. Home and the daily-goal celebration pair this avatar with the current Pokémon buddy. Question screens, navigation and learning records keep their existing behavior. The new asset is included in the v60 offline cache.

Local verification: all 25 regression tests pass, including celebration gating, active-time tracking and cache isolation. The celebration DOM mock now includes the image style property. All shipped JavaScript parses and the diff has no whitespace errors. GitHub regression and Pages deployment both succeeded for `4291d87eaf49b0a048bf4722e5139062894b9707`. Live browser checks confirmed v60, clear avatar and buddy placement on 320-pixel phone and 768-pixel tablet home layouts, and the complete celebration at 320 pixels. The celebration check used pre-existing synthetic activity with cloud sync disconnected and temporarily selected a 10-minute goal; the setting was restored to 15 minutes afterward. These are browser viewport checks, not a physical-device or offline-network test.

---

# v59 child interface simplification

Base: `8010fdcfe8be8020917b9986f680b5838ced1871` (v58).

Implemented: three child destinations on home; one buddy and a plain background; three activity choices per page; one-column practice; compact clock and picture controls; question replay for all practice modes; adult-only progress counters; simplified pause and goal dialogs. All nine activities and existing journal records remain available.

Local verification: 25 regression tests pass. The timer exclusion test now includes the game chooser. HTML IDs are unique and all nine activity buttons are present. Live browser checks at 320/390-pixel phone and 768-pixel tablet widths confirmed the quiet home, all nine games across three pages, counting and arithmetic layouts, and access to adult-only rewards. A correct counting answer was accepted and recorded in the journal; the speaker restored muted audio; manual pause held the clock at 9:53 during review. All activity was synthetic in a test browser with cloud sync disconnected. Initial GitHub regression and Pages deployment succeeded. Final live checks confirmed one visible tracing number, working next/previous arrows (1 → 2 → 1), and a complete tracing layout at 320 pixels. Final code regression and Pages deployment both succeeded for `2c432dfbbf44db6e4e25b7ff4429b3c6c7e4621b`; live assets use `v=59.1` and the app displays v59. These are browser viewport checks, not a physical tablet test.

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

# v65 visual foundations and daily reports

Play now cycles through structured number splitting, take-away manipulation, missing-part questions, undoing subtraction, predict-then-check, number composition and equal-group berry sharing. Each foundation skill has its own 5-of-6 varied first-try progression and smaller-number fallback. Built-in visual support remains explicit in records. No mental-strategy claims are inferred from keypad accuracy. Existing learning records and collection are retained.

Grown-ups provides today/yesterday reports, per-skill support and timing, matching weekly comparisons, retention and level changes, suggested practice and a text report download. The existing JSON export remains available for review in ChatGPT. Private Drive mirroring is not connected for Jonah; email remains disabled. Euna's existing relay accepts only Mochi backups and is not reused or modified.

Local: 43 passing tests, including all foundation UI branches in a synthetic DOM, construction correction, predict conceal/reveal, help credit, pending question restoration, bounds including zero, separate progression, report denominators and freshness. Existing timing, sync, reward catalogue and legacy activity tests pass. GitHub regression and Pages deployment succeeded for ec22a63e8c7b82d4a7cbb1e7cc92ed5d30d8cbd1 and the visual polish e904e4315ab837411e9f97ea277ee2cdb69ac008. Live checks in a synthetic, disconnected browser covered all seven new activities, moving parts, construction-error recovery, concealed prediction, equal groups, continuation and the daily journal. The journal showed 7/7 completed, 6/7 first-try and one helped answer, matching the test interactions. Today/yesterday selection worked. Phone (320 px) and tablet (768 px) views were exercised. This is not a physical tablet or live Firebase sync test.

# v66 private Drive learning mirror

Added opt-in Google Drive mirror controls to the grown-up journal. Uploads the same learning envelope as Export history, automatically while online and on explicit Send now, without changing the child interface. Connection settings remain local and are omitted from backup JSON. Opaque request completion is labeled request sent, never confirmed delivery.

The companion family Apps Script preserves Mochi's app/schema and filenames and adds distinct Jonah latest/weekly JSON files. It checks the existing shared secret, serializes writes, unions Jonah sessions by ID/revision and preserves existing files on malformed input. Existing Euna deployment and secrets are not modified by this repository update.

51 local regression tests passed: added coverage for opt-in configuration, endpoint validation, credential exclusion, bounded scheduling, retries, opaque-response wording, Euna compatibility, stale/duplicate session merges and malformed-payload handling. Google-side script deployment and first real Drive upload remain pending. The cloud script editor could not be reached during setup; no credentials, child data, or mirror configurations were changed in the connected accounts.
