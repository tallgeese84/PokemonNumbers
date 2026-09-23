# PokéMath Adventure

A personal math practice game for my son (age 5). Number writing, counting,
addition and subtraction to 20, wrapped in catch-them-all games.

Pokémon names and artwork are © Nintendo / Game Freak / The Pokémon Company.
Artwork is loaded at runtime from [PokeAPI](https://pokeapi.co) sprite hosting
and is not included in this repository. Personal, non-commercial project.

## Hosting on GitHub Pages
1. Create a repository and upload the contents of this folder (index.html at the root).
2. Repo Settings → Pages → Source: `main` branch, `/ (root)` → Save.
3. Your app is at `https://<username>.github.io/<repo>/` after a minute or two.

## Installing on the tablet
1. Open the URL in Safari (iPad) or Chrome (Android) **with internet on** —
   the first visit caches the app. Pokémon pictures are cached as they are displayed online.
2. Safari: Share → **Add to Home Screen**. Chrome: menu → **Add to Home screen** / **Install app**.
3. From then on it launches from its own icon and works offline with the artwork already viewed. New artwork needs a connection; built-in placeholders keep questions usable.

To ship an update, bump `CACHE = 'pokemath-v1'` in `sw.js` (v2, v3, ...) so
installed tablets pick up the new version.

## v64 — subtraction: predict, then check

Guided Play now repeats six subtraction questions, one addition and one counting question. It starts with subtraction.

The first automatic subtraction step shows the whole group with its numeral. The child taps Play when ready: the entire group is covered before the removed part appears outside. The number sentence stays visible. The remainder is revealed after success or through the eye help button; help and mistakes remain supported attempts. Spoken help models counting back from the starting number. This also replaces the explicit story setting's visible-remainder subtraction scene.

Covered-picture subtraction is a separate journal representation. Old visible-picture successes do not establish mastery of this new task. Six varied attempts meeting the existing independence rule unlock number-only subtraction; later steps include larger numbers and missing parts. History, parent overrides and collections are preserved.

Validation: 35 Node tests pass, including cover-before-answer behavior, help recording, stale interactions, zero remainder, adaptive evidence separation and the practice mix.

## v63 — responsive difficulty and the full illustrated collection

Difficulty can rise during the current session: at least 5/6 independently correct answers across four facts, with the latest three correct. Each skill advances one step at a time; three difficulties in five questions restore a support step. Speed is not required, parent ceilings remain respected, and later-day retention remains a separate journal metric. Counting avoids the previous three quantities and favours larger quantities after a step up. Existing learning history is reused.

The bundled PokeAPI snapshot includes 1,339 artwork-backed collectible entries: 1,025 species and 314 forms, including regional, Mega, Primal and Gigantamax variants. Twelve API entries without official artwork are excluded. The complete pool remains reachable after collecting all base species or all legendary species; catches are unique and all existing Pokémon are retained. Reward frequency stays unchanged. New catalogue data is cached offline; unseen artwork still needs an initial online visit.

## v62 — visual practice timer

A 48-pixel green pie fills as active practice accumulates. The child’s timer has no numerical clock, inner star, ticking or flashing. Existing pause/idle rules freeze progress, and the celebration still waits for the current question to finish. Exact elapsed and target time is shown in the grown-up journal, with an accessible time description on the pie. v61’s larger counting pictures remain in place.

## v60 — Jonah and his Pokémon

Jonah’s familiar avatar joins his selected Pokémon on home and in the daily-goal celebration. Questions stay clear, with the same simple Play button, clock, games and journal. The avatar is bundled and cached for offline use; no paid media service is used.

The character matches the `AV_IMG.jonah` avatar in [ChineseLearningP1-3](https://github.com/tallgeese84/ChineseLearningP1-3). `assets/jonah-avatar.webp` reuses the original `jonah_old_avatar.webp` image unchanged at its original resolution for crisp display.

## v59 — simpler for a child who is not reading yet

Home has one large **Play** button and Pokémon buddy, with two smaller picture buttons: **Games** and **Pokémon**. Games shows three choices per page. All nine activities remain available. Decorative scenery, marketing copy and repeated activity headings are removed from the child’s main flow.

Practice uses one column, a small clock/progress ring, a house button, pause, and a speaker button to repeat the question. The speaker also turns sound back on if it was muted. Spoken questions, quantity pictures, number sentences and learning aids remain available. Short icon controls replace long button labels. Writing shows just the current number with previous/next arrows and still advances automatically after completion. The daily goal still earns a large Pokémon celebration and spoken encouragement.

**Grown-ups**, at the bottom of home, opens the learning journal. Stars, streaks and rank are under **Rewards & progress** there. Daily/weekly analytics and settings retain their existing behavior; opening home or browsing games does not count as practice. Existing progress and cloud settings are retained. Email setup is not required.

Keyboard labels, reduced-motion support and browser zoom remain available. Online Pokémon/card artwork still has the existing availability limits.

For manual responsive review, open `tests/layout-preview.html` and choose 320, 390, 768 or 1024 pixels. This page embeds the real app and uses the current browser's app data; use a test browser with cloud sync disconnected.

## v57 — active learning adventures

The daily ring counts estimated active question time toward a 15-minute goal, with an effort celebration after the current question. The Journal button opens a learning journal with daily/weekly comparisons, independent versus helped outcomes, time by activity, and private JSON export. Automatic difficulty uses varied independent successes and later-day retention checks; speed is not a promotion gate. Existing progress and collectibles are retained.

See [REPORT_SETUP.md](REPORT_SETUP.md) to activate the 8 a.m. Madison-time GitHub email report. **Email remains disabled until repository secrets and the enabling variable are configured.** No Gmail access is required.

Run regression checks with `node --test tests/*.test.cjs`.
