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

## v58 — visual refresh

An illustrated meadow home, a large Pokémon guide/buddy, and one clear Start adventure action. Nine activity cards pair larger official artwork with original vector skill illustrations. Calmer practice screens have larger answer buttons, explicit activity titles and question replay controls. Tablet landscape arithmetic uses separate question and answer columns; phone layouts retain a single column. Counting balls, story trainers and the hide-and-seek tree are crisp built-in vectors.

The labeled **Journal** button opens daily/weekly analytics, a seven-day active-minute chart and practice guidance. Sync, backup and learning settings are in a separate expandable section. There is no email setup required to read the journal. Local data and existing cloud settings are retained.

Keyboard focus, reduced motion, browser zoom, modal focus and narrow canvas sizing are supported. The service worker caches the new local illustrations and style modules. Online Pokémon/card artwork still has the existing availability limits.

For manual responsive review, open `tests/layout-preview.html` and choose 320, 390, 768 or 1024 pixels. This page embeds the real app and uses the current browser's app data; use a test browser with cloud sync disconnected.

## v57 — active learning adventures

The daily ring counts estimated active question time toward a 15-minute goal, with an effort celebration after the current question. The Journal button opens a learning journal with daily/weekly comparisons, independent versus helped outcomes, time by activity, and private JSON export. Automatic difficulty uses varied independent successes and later-day retention checks; speed is not a promotion gate. Existing progress and collectibles are retained.

See [REPORT_SETUP.md](REPORT_SETUP.md) to activate the 8 a.m. Madison-time GitHub email report. **Email remains disabled until repository secrets and the enabling variable are configured.** No Gmail access is required.

Run regression checks with `node --test tests/*.test.cjs`.
