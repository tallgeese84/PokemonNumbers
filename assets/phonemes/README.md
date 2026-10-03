# Offline female phoneme clips

The built-in clips use **Kokoro-82M v1.0, American English female voice `af_heart`**, generated at **0.7 speed** with explicit IPA input. They replace the old eSpeak male clips. The model is Apache-2.0 and the kokoro-onnx wrapper is MIT; neither is downloaded or run by the child’s app. Only the resulting audio is bundled. There is no paid voice service or per-play request.

Reproduce with `tools/build-female-phonemes.py`. Model and voices: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1 . Voice reference: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md . The manifest records model/voice-file hashes, exact phoneme inputs, audio hashes, sample counts and duration. Output is checked for finite, non-silent, unclipped PCM. It remains synthetic speech; these checks are not human listening validation.

The alphabet board plays the sound immediately, then repeats after a 750 ms pause. Stop consonants remain brief; no written “buh” or “puh” is sent to text-to-speech. Q uses /k/ + /w/ and X uses /k/ + /s/. All clips and Pokémon pictures are precached for offline playback.

In v81, `female-v81/` replaces the previous clips so existing caches cannot serve the old sound. A raised-cosine envelope shapes the **audible portion**, rather than its surrounding silence: 40 ms entrance for sustained sounds, 4 ms for stop/affricate bursts, and an ending up to 90 ms (at most one third of the sound). Levels target 0.12 active RMS with a 0.7 peak ceiling; 55 ms lead and 160 ms tail silence provide room around each example. Phonemes and synthesis speed are unchanged. The manifest includes sample boundaries and fade lengths; PCM tests check quiet margins and low energy at the audible edges.

The home poster opens without a beep or automatic speech. Tapping the current playing letter again lets it finish. Switching letters cancels its queued repeat and fades its audio out over 75 ms before pausing it. This uses a Web Audio gain ramp when available, with a native-volume fallback. Parent-recorded clips keep their content and also use the soft interruption. Subjective naturalness still requires an on-device listen.

The tablet’s selected female-preferred voice still reads instructions. It is a separate voice: browser speech synthesis cannot export its narrator as isolated-phoneme audio. Grown-up recordings still override individual built-in sounds and can be removed in Grown-ups → Reading → Listen to or record the sounds.

Auditory word pronunciations in `reading-phonics.js` derive from the CMU Pronouncing Dictionary (https://github.com/cmusphinx/cmudict); its license is included. R-controlled sequences are grouped as teaching units; spelling units remain distinct from spoken sounds.
