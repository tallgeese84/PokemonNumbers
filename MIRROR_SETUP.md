# Jonah's private Google Drive learning mirror

Once connected, PokéMath automatically sends his learning history while the app is open and online. Offline records are kept locally and sent later. ChatGPT can read the JSON through your connected Google Drive when you ask for an assessment. This does not activate scheduled messages or email.

## Reuse Euna's existing mirror (recommended)

1. In Google Apps Script, open the project currently receiving Mochi backups. Keep its existing `MIRROR_SECRET` and `MIRROR_FOLDER_ID` script properties.
2. Replace its relay code with [`tools/family-drive-mirror.gs`](tools/family-drive-mirror.gs). This version accepts both apps and preserves Euna's filenames and backup format. If your live script has custom changes, merge this extension rather than replacing those changes.
3. Choose **Deploy → Manage deployments → Edit → New version → Deploy** on the existing web-app deployment. Keep the same URL and permissions.
4. On Jonah's device, open **Grown-ups → Learning journal → ChatGPT learning mirror · Google Drive**. Choose **Use Euna's saved connection** if Mochi is configured in the same browser. Otherwise copy the web-app URL and mirror secret from Mochi's grown-up settings. Do not put the secret in GitHub or this chat.
5. Enable automatic uploads, save, then **Send now**. Use the app for at least one question if there is no history yet.
6. Check Drive for `jonah-pokemath-latest.json`. Ask ChatGPT to verify it before relying on the mirror.

Jonah's latest file and `jonah-pokemath-YYYY-Www.json` weekly snapshot go into the same private folder, with distinct filenames. To use a separate private folder, set optional `JONAH_FOLDER_ID` in the script properties. Euna's files remain where they are.

## If creating a separate relay

Create a Google Apps Script project with the same code; set `MIRROR_SECRET` to a random secret (the app can generate one) and `MIRROR_FOLDER_ID` to your private folder ID. Deploy as a web app, executing as you, reachable by Anyone. The relay requires the secret in every POST body and never exposes learning records through GET. Authorize the Google permission prompt yourself. Save the resulting `/exec` URL and matching secret in Jonah's parent settings.

## What is saved

Session IDs/revisions, question facts and answers, hints, task representations, active-time estimates, per-question response timing, goal minutes, export time, and last confirmed Firebase sync time. No Gmail access, email credentials, Firebase URL/family code, or mirror secret is included in the JSON backup.

Uploads from different devices merge by session ID and revision; older uploads cannot remove newer sessions or lower their revisions. The relay serializes concurrent writes. The mirror is an analysis copy: it does not replace Firebase cross-device progress sync.

The browser uses an opaque request to Apps Script. “Request sent” is **not** proof of delivery: an old script or incorrect secret may reject it. The reliable check is the Drive file's `receivedAt` and `exportedAt` values. If the app is closed or offline, uploads wait until it opens and connects again.
