# Offline female phoneme clips

The built-in clips use **Kokoro-82M v1.0, American English female voice `af_heart`**, generated at **0.7 speed** with explicit IPA input. They replace the old eSpeak male clips. The model is Apache-2.0 and the kokoro-onnx wrapper is MIT; neither is downloaded or run by the child’s app. Only the resulting audio is bundled. There is no paid voice service or per-play request.

Reproduce with `tools/build-female-phonemes.py`. Model and voices: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1 . Voice reference: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md . The manifest records model/voice-file hashes, exact phoneme inputs, audio hashes, sample counts and duration. Output is checked for finite, non-silent, unclipped PCM. It remains synthetic speech; these checks are not human listening validation.

The alphabet board plays the sound immediately, then repeats after a 750 ms pause. Stop consonants remain brief; no written “buh” or “puh” is sent to text-to-speech. Q uses /k/ + /w/ and X uses /k/ + /s/. All clips and Pokémon pictures are precached for offline playback.

The tablet’s selected female-preferred voice still reads instructions. It is a separate voice: browser speech synthesis cannot export its narrator as isolated-phoneme audio. Grown-up recordings still override individual built-in sounds and can be removed in Grown-ups → Reading → Listen to or record the sounds.

Auditory word pronunciations in `reading-phonics.js` derive from the CMU Pronouncing Dictionary (https://github.com/cmusphinx/cmudict); its license is included. R-controlled sequences are grouped as teaching units; spelling units remain distinct from spoken sounds.
