# Family nightly integration — relay 1.2.0

Prepared 2026-10-08; not deployed. Source changes are staged on a review branch.
The existing upload block and all its helpers are byte-for-byte identical to the
original shared family relay. All 100 synthetic relay tests pass.
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
retention limitations for Euna or Hana. No learner data or deployment was touched.
Plan reads do not obtain the upload lock or write properties, Docs, or backups.

## Approval and live acceptance still required

Do not run setup, edit Script Properties, change access, or deploy until CJ approves.
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
