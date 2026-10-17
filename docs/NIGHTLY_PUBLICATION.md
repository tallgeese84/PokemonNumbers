# Nightly publication reliability — 17 October 2026

Private plans remain schema 1. Existing relay credentials, machine document identities, progress, rewards and time goals are unchanged. No private learner records belong in this repository.

## Deterministic publication

Use tools/verify-learning-source.cjs with a complete authenticated source download and independent Drive metadata before and after reading. A validated direct source is primary. A stale optional chunk feed does not veto a verified direct source. Do not use older attachments, partial snippets or invented metadata.

Fetch tools/nightly-publication.cjs, tools/nightly-catalog.json and tools/verify-learning-source.cjs from the same verified release. They run with Node standard libraries and no npm installation or full app checkout. Tests check the release catalog against actual app units and validators.

The real UTC clock is converted to America/Chicago independently of the scheduler's default timezone. Before 20:00 Chicago target the current day; at or after 20:00 target tomorrow, never an almost-expired day. Distinguish actual review date and maintenance using older evidence within the existing 72-hour limit. No export timestamp proves new practice or complete cross-device sync.

Read the private native Doc with its tab content and revision. inspectDocument validates a single plain-JSON tab, UTF-16 indexes and the final newline. prepare selects safe dates and revision semantics. replacement emits a requiredRevisionId-guarded native Docs request. INVOKE that returned request through the native Docs connector; generating the request does not publish it. Read back the native Doc and call verifyReadback. A human summary or successful task run is not publication. Journal updates happen after the machine plan.

CLI: node tools/nightly-publication.cjs prepare|verify private-input.json private-output.json. Prepare input keys: student,sourcePath,beforePath,afterPath,sourceFileId,parentId,documentPath,documentId,subjects. Paths must refer to real tool-returned files or accurately saved tool responses. Verify input keys: preparedPath,documentPath,documentId. Never commit those private inputs/outputs. Equivalent same-source retries are no-ops. Real same-day changes keep the ID and increase revision. Reject source/date regression, human edits, unexpected tabs and readback mismatches. On a revision conflict, reread and rebuild, never overwrite blindly.

## Scheduling and recovery

Run the overnight workers at explicit UTC instants after Chicago midnight in both standard and daylight time. A later family health job may retry a missing publication using fresh complete evidence and the same guarded transaction. Do not create duplicate tasks or reset an existing plan just to claim a new publication. Insufficient evidence remains unknown and built-in learning continues.

## Device evidence

Receivers export delivery.localDate, delivery.timeZone and a delivery stage distinct from network success. The five-minute throttle cannot block a fetch after a Chicago date change. Future plans remain cached until their own date. Euna's actual planned practice answers now retain an allowlisted plan ID/revision/session date through reload and older-device merges. Conflicting provenance is flagged; no old answer is retroactively relabelled. startedAt means an actual task was opened, not independently solved. The other apps retain existing answer provenance and safe-boundary adoption.

Saved work, prerequisite teaching and due review retain precedence. No forced takeover or storage reset. GitHub deployment and verified private publication do not by themselves establish tablet receipt, completed practice or improved learning.
