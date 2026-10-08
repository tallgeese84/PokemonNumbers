# Jonah nightly priorities — v88

Prepared and tested on a review branch; not deployed. The existing saved
`pokemath_drive_mirror_v1` connection must be enabled. Authenticated POST
`readJonahNextSession` uses its existing body secret. Family relay 1.2.0 reads only
`JONAH_NIGHTLY_PLAN_DOC_ID`, an optional property configured after owner approval.

Synthetic schema example (not Jonah's assessment or a published plan):
```json
{"schema":1,"id":"jonah-nightly-2026-10-08","revision":1,"student":"Jonah","timeZone":"America/Chicago","reviewedDate":"2026-10-07","sessionDate":"2026-10-08","generatedAt":"2026-10-08T05:10:00Z","sourceExportedAt":"2026-10-08T01:00:00Z","subjects":{"reading":{"focus":"Blend sounds into a word.","sounds":["a"],"words":["pin"]},"maths":{"focus":"Compare small numbers.","skills":["compare10"]}}}
```
Exact keys only. Each list has at most three unique entries. Reading needs at least
one sound or word; maths needs at least one nondelegated `PokeMathPath.BY` skill.
Choose sounds from reading-data.js G (alphabetic graphemes, 1–4 characters), and
words from authored blend/build lists or Daily.ACTIONS that reading-art.js `has`
supports. Normal routes still decide which of these are ready to be used. Focus is
plain text, 1–160 characters. No question text, answers, arbitrary code, URLs,
levels, rewards or timing overrides. Client enforces real calendar dates, Chicago
local day, source freshness (72 hours), same-date revision monotonicity and identity.

## Real app behavior

Let’s read remains a reading-only routine: 2 minutes sounds, 4 blend/build,
3 read-and-act, 3 story. Existing adaptive teaching, route gates, supplied-word
help, comprehension and mastery rules are unchanged. Eligible sound/word priorities
rank existing candidates; untaught words still receive explicit teaching. A target
is prioritised once per date, including across same-date plan revisions. It can
appear later through normal adaptive practice. Stories retain the existing choice.
No plan refresh restarts an active round; adoption happens when a new round begins.

Maths stays optional. The real Games → Gym practice path can select up to two
prioritised unlocked nondelegated skills per date within the chosen Gym. Due review
comes first. Counting, part-whole foundation and arithmetic delegate engines remain
under the built-in adaptive rules, so use specific supported path skills such as
numeral10/compare10 in the priority plan. Maths does not add compulsory daily time.
The legacy Play maths router is integrated too, but the Gym path is the verified
active entry point in the reading-first app.

No collection, buddy, shiny, reward, phonics audio or learner-state key is migrated
or cleared. Plan/cache data uses a separate key bound to a hash of the existing
connection. Offline same-date plans work; stale/invalid/missing/opaque responses
fall back to normal learning. Secrets are never stored in plan receipts or URLs.

Receipts live at `sessions[sessionId].learningState.nightlyPlan.state` and distinguish
received, adopted and started. Priority tasks carry `nightlyPlan` identity and
reading tasks additionally carry `nightlyTarget`. The unchanged relay already
preserves session contents and revision merging, so no upload schema migration is
needed. Metadata receipt alone is not proof of reading or answered questions.
A model/guide remains teaching, even when selected by a nightly plan.

## Verification and pending work

`npm test` — 148 tests pass, including 14 new nightly tests and the existing
collection, reading, maths, storage/sync, phonics and service-worker checks.
`npm run test:nightly` — full local DOM flow starts a real prioritised sound task,
finishes its model, receives a newer plan without replacing the task, opens a real
Gym task and verifies old sessions, caught Pokémon, shinies, buddy, other apps'
storage and the mirrored receipt. All relay traffic is mocked.
`npm run test:relay` — 100 three-child relay regression tests.

Pending approval: private Doc configuration/publication, scheduler write activation,
Google relay deployment; app merge/release and real-device acceptance also pending.
Daily plans require no daily GitHub commits or software-version increments.
