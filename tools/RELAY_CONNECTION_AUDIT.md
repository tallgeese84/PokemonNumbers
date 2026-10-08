# Relay connection audit — 2026-10-08

The owner's Apps Script screenshot shows two projects: **Mochi-drive-mirror**
and **Hana-drive-mirror**. The subsequently supplied saved source establishes:

| Project source | Uploads | Retention | Plan reader |
|---|---|---|---|
| Mochi | Accepts Euna/Mochi only | Latest plus weekly files | Existing readNextSession for Euna |
| Hana | Accepts Hana only | Latest plus daily UTC files; LAST_EXPORT_AT ordering | Missing until the standalone addition is installed |
| Jonah | Not yet identified | Do not infer from another project's source | Live route unknown |

These are saved-source observations, not verification of published deployment
versions or device connection settings. Both supplied handlers reject Jonah's
uploads. This does not prove Jonah's deployed upload endpoint is broken: a
different published version, project or account may be in use.

## Corrected upgrade path

Keep each existing project, deployment URL, secret, folder and historical files.
The shared family 1.2.0 template was tested against the repository's shared-family
baseline; it is **not** a byte-identical upload replacement for either supplied
standalone source. In particular, Hana's daily snapshots and LAST_EXPORT_AT are
different from the shared template's weekly snapshots and file-based ordering.
Euna's original duplicate-file cleanup and week-date implementation also differ.

For Hana, the HanaP3Math review branch now contains a supplemental
hana-nightly-reader.gs plus a single authenticated dispatch-line addition.
The original upload file and the owner's initializer remain unchanged.
See that repository's tools/HANA_STANDALONE_NIGHTLY_SETUP.md.
The app already uses the saved per-device connection; no secret copying or
connection migration is required.

Euna already has a reader in the supplied source. Verify the plan property,
document access and the existing deployment before replacing any source.
The shared-relay source in these review branches remains an alternative only for
an installation whose existing shared behavior has been confirmed and approved.

## Next read-only check

Compare the saved mirror /exec URL in each child's usual app/browser with the
active Web app URL under each project's Manage deployments screen. Record which
deployment matches; do not copy secrets into chat or repository files.
Identify Jonah's actual endpoint before recommending changes to it.
Do not conclude an unused folder means the child's entire learning history is absent.

Google deployment, permission/property changes, scheduled plan writes and
learner-data writes still require the owner's explicit approval.
Nothing in this audit changes those live resources.
