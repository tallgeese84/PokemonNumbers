# Activate daily email delivery

The app records activity locally immediately. Email is **not enabled by installing the code**.
No Gmail connection, Gmail password, or Gmail API is used. GitHub Actions sends through Resend.

1. On Jonah's usual tablet, open PokéMath → cloud button → **Save & sync now**. Reuse the existing Firebase database URL and family code. The Learning journal must say **Learning history synced**. New activity is stored at `/fam/<code>/pokemathAnalytics`, separately from the legacy progress snapshot. Existing Firebase rules must grant the same family access to that sibling. Do not make the database globally readable or publish the family code. This preserves the existing family's access model; it does not add Firebase user authentication.
2. Set up a Resend account and a verified sender. For initial personal testing, Resend's `onboarding@resend.dev` sender can send only to the Resend account owner's email; use the receiving Gmail as that account's email. Production senders require a verified domain. Create an API key with sending permission.
3. Repository → Settings → Secrets and variables → Actions → add these **repository secrets**:

   | Secret | Value |
   | --- | --- |
   | `POKEMATH_FIREBASE_URL` | The database URL from the tablet (no family path) |
   | `POKEMATH_FAMILY_CODE` | The same family code used on the tablet |
   | `POKEMATH_REPORT_TO` | Your receiving Gmail address |
   | `POKEMATH_REPORT_FROM` | A sender accepted by Resend, e.g. `PokéMath <onboarding@resend.dev>` for the owner's test inbox |
   | `RESEND_API_KEY` | Resend sending key |
   | `POKEMATH_FIREBASE_TOKEN` | Optional OAuth access token if your existing rules require it; expiring tokens require a proper refresh mechanism before enabling daily delivery |

   Never put these values in the repository or a GitHub issue/comment.
4. Actions → **Daily PokéMath report** → Run workflow with **dry_run checked**. It validates private data/configuration without emailing or printing learning data.
5. Run once with dry_run unchecked to verify delivery. Then add the repository **variable** `POKEMATH_REPORTS_ENABLED` = `true`.

Schedule: **08:00 America/Chicago**, including daylight-saving changes. The report covers the previous local calendar day. GitHub can delay scheduled runs; public-repository schedules may disable after 60 days without repository activity. The workflow does not promise exact-to-the-minute delivery.

Reports show estimated active practice, foreground and collection time, sections, independent versus helped answers, comparable weekly trends with sample sizes, later-day checks, difficulty changes, first-response mistakes, and a suggested next practice/offline activity. Historical time before v57 cannot be recovered.

Offline records upload on reconnection and every 30 seconds while open. The report shows last known device uploads and never interprets missing records as proof of no practice. Later uploads affect subsequent weekly summaries, not already-sent emails. The same-day email payload is frozen in the private database for safe retries; a sent receipt and Resend idempotency key prevent duplicates. Pending deliveries older than 23 hours stop for reconciliation.

## Parent controls and interpretation

The home button **Start today’s adventure** offers a counting warm-up, targeted arithmetic (using recent evidence when available), a different-skill check-in, then more targeted practice until the time goal. Individual activities remain available.

Open the cloud button for Learning journal, daily/weekly views, active goal (10/15/20 min), optional 3-minute bonus, and JSON history export. These are casual parent controls, not password protection. Default goal: 15 active minutes. No duration increase is automatic.

For full adaptive arithmetic, choose **Auto** under picture support and **Auto** under number ceilings. The first v57 launch selects Auto picture support to enable the new learning sequence. Subsequent parent choices are respected. Automatic steps are pictures within 5 → numerals within 5 → numerals within 10 → missing-part within 10 → missing-part within 20. Counting and other manipulatives progress 5 → 10 → 20 (Hide and Seek stays within 10). Numbers never jump from 5 to 20. Speed does not decide promotion. At a level, 8/10 independent successes across at least four facts establish provisional readiness; three independent, distinct facts on a later day confirm the next step. Repeated errors lower a step; difficult facts are revisited after intervening questions.

Built-in visual support is part of the task, not an extra hint; it is labelled and compared separately. Tracing completion does not establish freehand writing mastery. Thresholds are initial design choices, not validated learning or attention diagnostics. The timer may count up to 60 seconds after the last interaction while a question is visible; **Still thinking?** pauses it until resumed. Sleeping devices, hidden tabs, rewards, parent controls, and collection browsing do not count. Multiple tabs share a timer lease. Separate simultaneously used physical devices cannot determine which one Jonah is attending to.

Only newly observed data guide adaptation; old completion totals are deliberately not treated as mastery. Keep the parent goal at 15 until there is enough matched evidence and Jonah is willing to continue.

## Verification

Run `node --test tests/*.test.cjs`. Tests use synthetic data and mocked network responses. They never access a child's Firebase records or send real mail.

Primary references: [GitHub schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Firebase conditional writes](https://firebase.google.com/docs/database/rest/save-data#section-conditional-requests), [Resend send API](https://resend.com/docs/api-reference/emails/send-email), [Resend testing domain](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
