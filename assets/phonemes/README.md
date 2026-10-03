# Offline phoneme clips

Generated from explicit phoneme synthesis with eSpeak NG via the Echogarden Emscripten package 0.3.5 (https://github.com/echogarden-project/espeak-ng-emscripten). The engine is GPL-3.0; no engine binary or voice database is distributed here, only generated audio. Reproduction code: `tools/build-phonemes.mjs`.

The manifest records source inputs, returned IPA events, boundaries, sample counts and hashes. Sounds were checked for matching phoneme events and non-silent audio. These are synthetic clips, not human recordings or a clinical pronunciation assessment. An adult can preview and override them under Grown-ups → Reading.

Auditory word pronunciations in `reading-phonics.js` derive from the CMU Pronouncing Dictionary (https://github.com/cmusphinx/cmudict); its license is included. R-controlled vowel sequences are grouped into teaching units. Spelling units are distinct from spoken sounds: x is /k s/ and qu is /k w/.
