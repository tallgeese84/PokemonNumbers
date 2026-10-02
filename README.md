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

## v74 — English check and building up from his level

**Fix:** in Build it, after two misses the help faded every letter except the next one, including letters needed for later boxes, so a word like "dot" could not be finished. Help now fades only letters the word no longer needs and pulses the next letter.

**English check** (replaces the reading check; runs once on the next reading turn, including for children placed by the old check): seven short parts, easiest first, one try each, no help. Each part stops early after a run of misses, so a pre-reader finishes in about 15 taps and never sees words he cannot read.
1. Understands spoken words (tap the picture) · 2. Hears rhymes · 3. Hears first sounds · 4. Blends sounds by ear · 5. Letter sounds, in teaching order, all 25 if he keeps going (q comes with qu later) · 6. Reads short words — only if he knows five or more sounds including a vowel · 7. Tricky words — only if he read three words.

Results give a level (Sound explorer, Letter learner, Word blender, Confident beginner reader), the letter sounds he knew, and a start point. Grown-ups → Reading · P1 readiness shows the results; *Redo English check* runs it again.

**Building up from there**
- New sounds come two or three at a time (s a t, then p i n), each with its picture, writing and shape practice; the next set waits until each sound has one clean success.
- Words are offered only from sounds he has shown he knows, not merely met.
- A Sound explorer plays listening games (rhyme, first sounds, blending by ear) and letter-sound games until four route-1 sounds are secure and he blends by ear 4 times in 5.
- A sound he keeps missing is shown again (picture, keyword and sound) before more quizzing.
- Letter games start with two big choices and add more as his set of sounds grows; Build it starts with one spare letter.
- Ambiguous pictures (for example 🦋 for "moth") are left out of listening games.

## v73 — Buddy is the "Fox" by pxltiger

Buddy now uses **"Fox" by pxltiger** ([Sketchfab](https://sketchfab.com/3d-models/fox-39f97fe58f0b47ce80b6e02814001dd7)), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), shown as the author made it (standing idle pose, the model's own material and normal map, lit with one key light and a real shadow as on Sketchfab), unchanged apart from optional accessories. `assets/fox.glb` is bundled with Three.js's GLTFLoader and SkeletonUtils (MIT) and cached for offline use.

He grows bigger as Jonah learns, and each of the nine learning milestones (reading routes plus two points per maths Gym badge) teaches him a trick: nod, look around, shake head, spin jump, walk, tail swish, run, pounce and somersault. Tapping him plays a trick he knows; treats and toys use the model's animations too. The earlier home-made fox models are retired.

## v72 — Buddy with real fur, sitting in a firefly forest

New model: a sitting fox cub with a round head, short white muzzle, big watery eyes, fluffy white cheeks and chest ruff, dark-rimmed ears with white fluffy insides and dark paws. Fur is drawn as 18 layers of hair strands (darker roots, lighter tips, rim light) on every part, including the tails. One tail curls round his side; more tails fan out behind. He sits in a misty forest with glowing fireflies. If a tablet draws slowly, Buddy steps down to fewer fur layers automatically.

## v71 — Buddy, rebuilt in higher quality

The fox is now called **Buddy** and has a new model (`fox-model.js`): sculpted smooth body and head, natural red-fox colouring (orange coat, white chest, muzzle and tail tips, dark stockings and ear backs), glossy eyes with brown irises, smooth tapered tails, a fur colour and bump texture, and layered shell fur for a soft fluffy surface. Rendering uses the tablet's full screen resolution, filmic tone mapping, soft shadows and key/rim/fill lighting. If a tablet draws slowly, Buddy automatically uses half the fur layers.

## v70 — Jonah's nine-tailed fox

Home has a third button, **Fox**. Buddy (renamable in Grown-ups → Jonah's fox) is an original 3D nine-tailed fox from folklore, built from simple shapes with Three.js r128 (bundled in `assets/vendor`, MIT licence) so it works offline.

- **Grows from learning only.** One point per reading route passed and two per maths Gym badge (34 in all). The cub grows bigger with every point and gains tails 2–9 at 2, 6, 10, 14, 18, 23, 28 and 34 points, so the ninth tail arrives when both paths are complete. The Fox button glows when a new tail is waiting; opening the den shows it growing in.
- **Leaves.** Every star he earns in reading or maths also drops a leaf 🍃. Leaves buy treats (berries, rice ball, fish, cake), toys (ball, bubbles) and things to wear (scarf, bell, flower crown, top hat). Nothing can be bought without enough leaves, and wearables are kept.
- **Never sad.** No hunger, decay or guilt; tap to make him hop, drag to turn him round.
- Fox state syncs with the rest of the progress (leaves and purchases merge without loss).

## v69 — the maths path to P1

Play's maths questions now come from a **maths path**: 28 skills in 8 Gyms, from K2 groundwork to the full Singapore P1 syllabus (2021): numbers to 100 with tens and ones, ordinals, comparing and patterns; adding and subtracting within 100 (mental within 20, renaming, story problems with bar-model help); multiplying within 40 and dividing within 20; money to $1 and $100; time to 5 minutes; length in cm; 2D shapes; picture graphs.

- **Early skills keep the existing games.** Counting, number bonds, adding/taking away within 10 and equal groups still use the part-whole and adding activities, and their history counts towards the path.
- **Mastery opens the next skill.** A skill is secure after 5 of 6 recent first-try answers across varied questions (latest 3 right); mastered after a later-day success. Skills with harder steps (renaming, half past → 5 minutes) climb one step at a time and drop back after repeated difficulty. Secure skills return for review.
- **Short maths check** the first time (one try per item, stops at the first miss) places him on the path.
- **Gym badges**: finishing a Gym earns its badge; Games → **Gyms** shows them and lets him train any open Gym.
- **👀 help** shows a picture (ten frames, tens and ones blocks, bar models, skip-counting labels, clock minute marks, ruler end) and counts as help.

Grown-ups → **Maths · P1 readiness**: current Gym, pace (all Gyms by October 2027), P1 strands, every skill's status, what he is working on with an idea to try at home, redo the check, mark a skill as known.

## v68 — reading joins PokéMath

Jonah's Poké Reading app is now a reading wing inside PokéMath, aimed at Singapore P1 English (January 2028).

**Play** alternates short blocks: a reading round (about five items), then four maths questions, aiming for about 60% reading by active time. The daily goal default is now 20 minutes (10/15/20/25 in the journal). Games has three new tiles: **Read**, **Books** and **Letters**.

What changed in how he learns to read:
- **Decode first.** In Read it, the word is shown as sound buttons and the app does not say the word before he answers. He taps sounds himself; 👂 help models the sounds, then the blend, then the word. Help and misses are recorded as helped, never independent.
- **Mastery, not completion.** Every sound, word and tricky word is tracked. Secure = two independent successes; mastered = success again on a later day. A route opens the next only when its sounds, six words, tricky words and book are secure.
- **Spaced review.** Earlier routes' items come back when due, mixed across sounds, words and tricky words.
- **Short reading check** on first play (one try per item, no fading), so the old app's completed routes are verified rather than trusted.
- **Sound Ears** listening games (first sound, blend by ear, count the sounds), **Read and tap** sentences, a comprehension question after every book, and Name Catch (read a Pokémon's name to catch it).
- **18 routes** (12 original plus igh/ear/air, ay/ou/ie/oy, ue/aw/ew/wh/ph, -s/-ing/-ed, two-syllable words, capitals and full stops). All 92 Dolch pre-primer and primer words are taught. Every practice word, book sentence and readable name is checked by test to decode with only the sounds taught so far.

Grown-ups → **Reading · P1 readiness**: route, what the current route still needs, pace against a P1 timeline (all routes by October 2027), a nine-row readiness checklist, *Listen to Jonah read* (mark each page), redo the reading check, move route, letter names, and recording sounds in your voice. Reading appears in the journal and daily report.

The old app's progress (same site) is imported once: its caught Pokémon join his collection and its sound recordings are used. To retire the old app, copy `tools/reading-redirect/index.html` and `sw.js` into the PokemonReading repository.

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
