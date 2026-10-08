# Family nightly integration — relay 1.2.0

## Current installation: inspect before replacing source

The owner deployed the tested shared relay 1.2.0 as Google Version 5 on
2026-10-08, preserving its existing URL, secret, folders and upload behavior.
Version 4 remains the rollback reference. The fixed private plan readers are
configured for all three children. Euna's actual device received her October 8
plan; Hana h22 confirmed a normal upload and authenticated empty-plan response.
Hana's first plan is now published and her midnight reviewer is enabled. Jonah
v88 is the third app release; no further Google deployment is required for it.
See [the connection audit](RELAY_CONNECTION_AUDIT.md) for evidence and history.

The existing upload block and all its helpers are byte-for-byte identical to the
original shared family relay. All 102 synthetic relay tests pass.
Run: `node --test tools/family-relay-tests/family-relay.test.cjs`.

Authenticated POST bodies contain only `action` and the existing `secret`:
- `readNextSession`: Euna; existing `NIGHTLY_PLAN_DOC_ID`; Mochi protocol unchanged.
- `readHanaNextSession`: Hana; optional `HANA_NIGHTLY_PLAN_DOC_ID`.
- `readJonahNextSession`: Jonah; optional `JONAH_NIGHTLY_PLAN_DOC_ID`.
Sibling responses: `{ok, service:"family-learning-mirror", planApi:1, student, plan}`.
Missing, invalid or crossed plan documents fail closed without any backup writes.
Only fixed private Google Docs can be read. Public GET returns metadata only.
These routes are isolated by child, but retain the existing shared secret; they
are not separate Google-account identities. No permissions or secrets are changed.

## Preservation boundary

Euna whole-snapshot storage, Hana older-export skipping/allowlist, Jonah session
union/revision merging, existing latest/weekly filenames, folder fallback and
locks are unchanged. This does not retroactively fix the original snapshot
retention limitations for Euna or Hana. Tests use synthetic files only and never submit learner uploads to production.
Plan reads do not obtain the upload lock or write properties, Docs, or backups.

## Change boundary and live acceptance

The approved owner-run setup/deployment is complete. Further changes to Script
Properties, permissions, secrets, folders or the live Google deployment still
require explicit approval.
Before deployment, retain the saved source and current deployment version for rollback.
Configure only missing child plan IDs to verified owner-controlled private machine
Docs; preserve all existing properties, URL, secret and sharing. Replace the current
script rather than appending duplicate handlers. Publish a new version of the SAME
deployment. `checkFamilyRelayReadOnly` checks saved code only, not the published URL.
Confirm each child's real-device plan receipt (child/date/revision), safe session
adoption and later activity evidence. Normal uploads must still reach each child's
own file; verify on Drive. A sent opaque request is not a delivery receipt.
Do not send fabricated learning uploads to production. Roll back the deployment
version if needed; do not delete records or reset devices.

Nightly plans are private dated data. They require no app-version bump or daily
GitHub commit. Scheduler publication, device receipt, adoption, and actual use are
four separate states; none should be claimed on the strength of another.
