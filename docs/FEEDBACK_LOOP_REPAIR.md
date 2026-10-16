# Feedback-loop reliability repair — 16 October 2026

## Runtime delivery

Private priorities still use the existing authenticated relay and strict schema 1.
No public plan, learner responses, credentials, API keys or private document IDs belong in this repository.
Receivers record allowlisted reason codes, last attempt/success, consecutive failures and separate receipt/adoption/use information. Network failures retry twice (30 seconds, then 120 seconds), only while visible and online. A five-minute foreground check can discover a plan published after the page opened. Existing saved tasks are never replaced mid-question. Cached plans cannot be relabelled for another day or grant learning credit.

Publication is not proof of delivery. Receipt is not proof of adoption. A started or completed priority is not proof of mastery. A device that has not checked since publication is normally pending, not failed.

## Child-specific evidence

Mochi: unreviewed written responses stay pending, outside confirmed-error and supported-success totals. Explicit adult review applies to the reviewed response version. A single bounded structured check may clarify an unreviewed explanation without forcing a whole-lesson error loop. Original automated marks, response history and rewards are not rewritten.

Hana: a priority already present in a protected word-problem/review slot is tagged in place, not displaced. Persistent part-whole difficulty gets whole/parts/operation prompts inside the existing question. Support is saved per step and never counted independent. It fades on the next changed question. Recall, checkpoints, explicit focus and exam items remain unprompted unless help is requested.

Jonah: the existing reading sound IDs also identify the letter-name/sound/case checks in the adult-led A–Z routine. Check identities are separate for name/sound and upper/lower case. The school-selected or already-started letter set wins. Two-day retention, explicit teaching, help flags and the 12-minute guide are unchanged. The adult-led guide uses 4+3+2+3 minutes; the legacy routine retains its own stages. Unobserved audio and model taps are not recall evidence. The v97 media cache is retained to avoid redownloading unchanged phonics and artwork.

## Review worker: complete source transport

The trusted helpers in PokemonNumbers/tools/verify-learning-source.cjs and family-loop-health.cjs accept private runtime inputs, never committed configuration. The review worker may use a complete authenticated Drive download after checking source metadata independently before and after the fetch. Verification rejects changed identities, byte counts, app/schema, mixed exports and future timestamps. The generated chunk feed remains an optional verified fallback; a stale secondary feed must not prevent a verified current direct read. Never pretend an old chunk generation is current.

Daily plan text stays private, pure JSON, revision-guarded and read-back verified. Existing native document IDs, privacy, folder location and topology are retained. If no safe current evidence exists, preserve the plan and report the cutoff. The protocol validators still enforce the 72-hour source bound and local session date.

A source-freshness proof, plan validation, publication readback and a later matching device receipt are required for end-to-end acceptance. GitHub publication does not update an already deployed Apps Script version. No live relay or Google trigger deployment is claimed by this release.
