# Relay connection audit — 2026-10-08

## Live verification — October 8, 2026, 5:40 PM America/Chicago

The owner deployed family relay 1.2.0 as Google **Version 5**, retaining the
existing deployment URL. Its live public GET returns HTTP 200, relayVersion 1.2.0,
planApi 1 and writeOnly false. Version 4 remains the rollback reference.

Owner-run saved-source checks successfully read the configured private plan Docs
for all three children. Hana and Jonah returned readOk true and state empty.
The owner then supplied a screenshot from Euna's actual app showing:
"Nightly priorities received and available to Daily Quests. Plan 2026-10-08,
revision 1." This verifies delivery through that device's saved connection.
It does not by itself establish completed practice or a subsequent upload receipt.

An independent server POST using a credential read from a screenshot returned
Unauthorized; that credential extraction was not independently verified. Do not
infer Euna's saved app connection is broken from that test; her subsequent device
receipt establishes that it works. No test sent learning uploads or changed data.

Hana's app connection and ordinary upload remain unverified: no Hana latest mirror
was found in the shared configured folder or the accessible Drive filename search.
Keep her existing connection if configured; otherwise establish a family connection
on her usual device. Her app release, nightly task activation and live receipts are
tracked in stage 2. Jonah remains stage 3. Daily plans need no GitHub commits.

Earlier sections below are the audit trail, not the current deployment status.

## Confirmed active shared deployment

The owner identified Jonah's saved app endpoint and matched it to the active
**Family learning mirror: Euna, Jonah and Hana** deployment in
**Mochi-drive-mirror**. The deployment screenshot shows **Version 4**, dated
September 27, 2026, 10:04 PM as displayed. Retain Version 4 as the rollback target.

A public GET to that endpoint returned `family-learning-mirror`, all three app
names and `writeOnly:true`. This establishes its advertised interface, not
successful authenticated uploads or plan delivery. No POST was sent.

The owner then supplied Code.gs from Version 4. Its text exactly matches
`family-relay-tests/family-original.gs` in all three review branches:
SHA-256 `16b0b660547f21c75e8ff729179430578ba6b1180401298ae9f946d5b15bc559`.
Relay 1.2.0 retains that baseline's upload block and all upload helpers
byte-for-byte. The 102 synthetic relay tests passed again after this comparison.

| Source or deployment | Uploads | Retention | Plan reader |
|---|---|---|---|
| Active shared Version 4 in Mochi-drive-mirror | Euna, Hana and Jonah | Latest plus weekly; Hana export ordering; Jonah session/revision merge | None |
| Current saved Mochi editor source supplied earlier | Euna only | Latest plus weekly, with different helpers | Euna only |
| Saved Hana-drive-mirror source supplied earlier | Hana only | Latest plus daily UTC files; LAST_EXPORT_AT ordering | None |
| Prepared shared relay 1.2.0 | Same upload behavior as active shared Version 4 | Same as Version 4 | Fixed private readers for all three children |

Do not deploy the current Euna-only editor source to the shared deployment.
It would reject sibling uploads. A separate Jonah Apps Script project is not
needed for the endpoint the owner identified.

## Upgrade path and remaining evidence

Use the tested `family-drive-mirror.gs` to prepare the shared Version 4 upgrade,
keeping the existing deployment URL, secret, folder properties and access setting.
Retain the current saved source too; the Euna-only source supplied by the owner is
already archived as `family-relay-tests/euna-only-v7.7.0.gs`.

Only missing fixed plan-document properties should be added after approval.
`checkFamilyRelayReadOnly` checks saved source/configuration; it does not prove
published endpoint access, browser CORS, device receipt or session adoption.
Complete that check and resolve errors before publishing a new version of the
same deployment. Do not send synthetic learning uploads to production.

The actual saved endpoints on Euna's and Hana's usual devices still need matching.
Shared Version 4 supports Hana, but that does not prove her app uses it. Preserve
Hana-drive-mirror until this is resolved. If Hana uses that standalone deployment,
apply the supplemental reader and single dispatch line documented in HanaP3Math's
`tools/HANA_STANDALONE_NIGHTLY_SETUP.md`. Preserve its daily snapshots,
LAST_EXPORT_AT, original initializer and other settings. Do not migrate it to
shared weekly storage merely because a shared endpoint exists.

## Status

Implementation and app integrations are on the existing draft review branches.
No app PR has been merged or deployed by this work. Shared relay 1.2.0 has not
been deployed. No Google properties, permissions, secrets, plan documents,
nightly schedules or learner data were changed. Actual authenticated uploads,
live plan delivery, app adoption and subsequent practice remain separate checks.

Google deployment, permission/property changes, scheduled plan writes and
learner-data writes still require the owner's explicit approval. Daily plans
remain private data and require no daily GitHub commits or app-version changes.
