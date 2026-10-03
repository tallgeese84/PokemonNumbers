# Offline phoneme clips

## Approved recordings (v82)

All A–Z letter sounds, plus **ch, sh and ng**, use prerecorded Buzzphonics audio. The parent approved a sample of M, S, P, A, T and SH before this update. The original project is for UK English phonics; its vowel models differ from the previous US English synthesis.

Source: https://github.com/hellodeborahuk/buzzphonics at commit `f51eeb71cba61334328a37e6eda9733a89ffcb82`.
Copyright (c) 2022 Debbie Dann. The upstream README explicitly describes Phonics sounds as MIT licensed. The complete notice is retained in [recorded-v82/LICENSE.txt](recorded-v82/LICENSE.txt) and linked from Grown-ups → Reading → Listen to or record the sounds.

`tools/build-recorded-phonemes.py /path/to/buzzphonics` reproduces the 28 WAVs from the reviewed source checkout with ffmpeg and numpy. Whole recordings are decoded to mono 24 kHz PCM16. Constant gain is `min(6, 0.65 / peak)`, the same treatment as the approved sample. There is no trimming, audible-edge fading, time-stretching, synthetic phoneme generation or added vowel. The original lead/tail timing is retained and incidental recorder metadata is omitted. Each file's source URL, source hash, output hash, sample count and gain are recorded in `recorded-v82/manifest.json`.

C and K share the source C recording. Q uses the complete **qu** recording and X the complete **x** recording; their two-phoneme decomposition remains intact for sound-counting activities. Playback resolves explicit pronunciation overrides before the spelling, so an A representing long /ay/ does not accidentally play short A.

The poster plays a recording twice, waiting for its natural end plus a 750 ms pause before the repeat. Repeated taps on the same playing card do not restart it. Switching letters cancels queued repetitions and releases the old audio over 75 ms. Guided letter lessons, sound tiles and letter-writing feedback use the same recordings; follow-on letter names and writing transitions wait for completion. All files are precached for offline playback.

## Advanced-sound fallback

Other vowel teams and **th/dh/zh** retain the Kokoro-82M v1.0 American English female voice `af_heart` at 0.7 speed. These have not been presented as part of the approved Buzzphonics replacement. The two `oo` source files and advanced UK vowel/r correspondences need separate listening/mapping review before replacing the US phoneme inventory.

`tools/build-female-phonemes.py` reproduces these fallback clips. Model and voices: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1 . Voice reference: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md . The model is Apache-2.0 and the wrapper MIT. Only audio is bundled; no model download or paid voice service runs in the child's app. `manifest.json` records the model/voice hashes and exact IPA inputs.

The v81 fallback clips have an audible-content envelope, level headroom and quiet margins. PCM and hash checks establish file integrity, not human pronunciation quality.

## Parent recordings and narration

A grown-up's custom recording still overrides its built-in sound. Recordings stay on the tablet and can be removed in Grown-ups → Reading → Listen to or record the sounds. The device narrator reads instructions using its existing female-preferred voice; the clips are separate recordings.

Auditory word pronunciations in `reading-phonics.js` derive from the CMU Pronouncing Dictionary (https://github.com/cmusphinx/cmudict); its licence is included. R-controlled sequences are grouped as teaching units; spelling units remain distinct from spoken sounds.
