"""Build offline female phonics clips. No paid service or runtime model download.

pip install kokoro-onnx==0.6.1 soundfile
python tools/build-female-phonemes.py MODEL.onnx voices-v1.0.bin

Model/voices: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1
Kokoro-82M v1.0 fp16 (Apache-2.0); kokoro-onnx wrapper (MIT).
Explicit IPA input avoids TTS reading letter names or the spelling "puh".
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import onnxruntime as rt
import soundfile as sf
from kokoro_onnx import Kokoro

PHONES = {
    'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɑ', 'u': 'ʌ', 'uu': 'ʊ',
    'ee': 'i', 'oo': 'u', 'ay': 'eɪ', 'oh': 'oʊ', 'eye': 'aɪ',
    'ow': 'aʊ', 'oy': 'ɔɪ', 'aw': 'ɔ', 'ar': 'ɑɹ', 'or': 'ɔɹ',
    'er': 'ɜɹ', 'ear': 'ɪɹ', 'air': 'ɛɹ',
    'b': 'b', 'd': 'd', 'f': 'f', 'g': 'ɡ', 'h': 'h', 'j': 'dʒ',
    'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p', 'r': 'ɹ',
    's': 's', 't': 't', 'v': 'v', 'w': 'w', 'y': 'j', 'z': 'z',
    'sh': 'ʃ', 'ch': 'tʃ', 'th': 'θ', 'dh': 'ð', 'ng': 'ŋ', 'zh': 'ʒ',
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model')
    parser.add_argument('voices')
    parser.add_argument('--out', default='assets/phonemes')
    args = parser.parse_args()
    rt.set_default_logger_severity(3)
    opts = rt.SessionOptions()
    opts.intra_op_num_threads = 2
    k = Kokoro.from_session(rt.InferenceSession(args.model, opts,
        providers=['CPUExecutionProvider']), args.voices)
    out = Path(args.out)
    (out / 'female').mkdir(parents=True, exist_ok=True)
    manifest = {'engine': 'Kokoro-82M v1.0 fp16 / kokoro-onnx 0.6.1',
        'voice': 'af_heart', 'language': 'en-US', 'speed': 0.7,
        'modelURL': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.fp16.onnx',
        'modelSHA256': hashlib.sha256(Path(args.model).read_bytes()).hexdigest(),
        'voicesSHA256': hashlib.sha256(Path(args.voices).read_bytes()).hexdigest(),
        'validation': 'Explicit phoneme inputs; finite, audible PCM, duration, peak and hashes checked. Synthetic female voice, not a human pronunciation assessment.',
        'clips': {}}
    for key, ipa in PHONES.items():
        samples, sr = k.create(ipa, voice='af_heart', speed=0.7,
            is_phonemes=True, trim=False, sentence_pause=0, clause_pause=0)
        if not np.isfinite(samples).all():
            raise ValueError('Non-finite audio: ' + key)
        # Trim only edge silence; retain a little room for consonant releases.
        peak = np.max(np.abs(samples))
        if peak < .005:
            raise ValueError('Inaudible audio: ' + key)
        audible = np.where(np.abs(samples) > max(.0005, peak * .008))[0]
        start = max(0, int(audible[0]) - int(.025 * sr))
        end = min(len(samples), int(audible[-1]) + int(.06 * sr))
        samples = samples[start:end].copy()
        # Uniform peak level, with tiny edge fades to prevent clicks.
        samples *= .82 / np.max(np.abs(samples))
        fade = min(int(.003 * sr), len(samples) // 4)
        samples[:fade] *= np.linspace(0, 1, fade)
        samples[-fade:] *= np.linspace(1, 0, fade)
        samples = np.pad(samples, (int(.025 * sr), int(.09 * sr)))
        if not .12 <= len(samples) / sr <= 2.5:
            raise ValueError('Unexpected duration: ' + key)
        file = out / 'female' / (key + '.wav')
        sf.write(file, samples, sr, subtype='PCM_16')
        manifest['clips'][key] = {'file': 'female/' + key + '.wav',
            'phoneme': ipa, 'samples': len(samples), 'sampleRate': sr,
            'durationMs': round(len(samples) / sr * 1000),
            'rms': round(float(np.sqrt(np.mean(samples ** 2))), 5),
            'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}
        print(key, manifest['clips'][key]['durationMs'], flush=True)
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=2,
        ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
