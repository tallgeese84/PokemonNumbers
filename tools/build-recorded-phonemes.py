"""Bundle the approved Buzzphonics recordings without cropping or retiming.

Usage: python tools/build-recorded-phonemes.py /path/to/buzzphonics
Requires ffmpeg and numpy. Source: https://github.com/hellodeborahuk/buzzphonics
The source snapshot and each original audio hash are recorded in the manifest.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import wave
from pathlib import Path

import numpy as np

SOURCE_COMMIT = 'f51eeb71cba61334328a37e6eda9733a89ffcb82'
SOURCES = {k: k + '.m4a' for k in
    ['a','e','i','o','u','b','d','f','g','h','j','l','m','n','p','r',
     's','t','v','w','y','z','sh','ch','ng','qu','x']}
SOURCES['k'] = 'c.m4a'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_root', type=Path)
    parser.add_argument('--out', type=Path, default=Path('assets/phonemes/recorded-v82'))
    args = parser.parse_args()
    commit = subprocess.check_output(['git','-C',str(args.source_root),
        'rev-parse','HEAD'], text=True).strip()
    if commit != SOURCE_COMMIT:
        raise ValueError('Use the reviewed Buzzphonics snapshot: ' + SOURCE_COMMIT)
    args.out.mkdir(parents=True, exist_ok=True)
    manifest = {'source': 'https://github.com/hellodeborahuk/buzzphonics',
        'sourceCommit': commit, 'license': 'MIT',
        'copyright': 'Copyright (c) 2022 Debbie Dann', 'language': 'en-GB',
        'voice': 'Prerecorded Buzzphonics voice; sample approved by parent',
        'playbackRate': 1,
        'processing': 'Full recordings decoded to mono PCM16 at 24kHz. '
            'Constant gain only, matching the approved sample: min(6, 0.65/peak). '
            'No trimming, fades, retiming, phoneme synthesis or added vowels. '
            'Incidental recorder metadata omitted.',
        'scope': 'All A-Z letter sounds plus ch, sh and ng. Advanced vowel '
            'teams and th/dh/zh retain the previous model pending review.',
        'clips': {}}
    for key, name in SOURCES.items():
        source = args.source_root / 'public/sounds' / name
        raw = subprocess.check_output(['ffmpeg','-v','error','-i',str(source),
            '-ac','1','-ar','24000','-f','f32le','-'])
        samples = np.frombuffer(raw, dtype='<f4').copy()
        if not np.isfinite(samples).all() or len(samples) < 2400:
            raise ValueError('Invalid recording: ' + key)
        peak = float(np.max(np.abs(samples)))
        if peak < .001:
            raise ValueError('Inaudible recording: ' + key)
        gain = min(6, .65 / peak)
        samples *= gain
        file = args.out / (key + '.wav')
        with wave.open(str(file), 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(24000)
            wav.writeframes((np.clip(samples, -1, 1)*32767).astype('<i2').tobytes())
        manifest['clips'][key] = {'file': key+'.wav', 'sourceFile': name,
            'sourceURL': 'https://raw.githubusercontent.com/hellodeborahuk/buzzphonics/'
                +commit+'/public/sounds/'+name,
            'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'sha256': hashlib.sha256(file.read_bytes()).hexdigest(),
            'sampleRate': 24000, 'sourceDecodedSamples': len(samples),
            'samples': len(samples), 'durationMs': round(len(samples)/24),
            'gain': round(gain, 8), 'rms': round(float(np.sqrt(np.mean(samples**2))),5)}
    shutil.copyfile(args.source_root/'LICENSE', args.out/'LICENSE.txt')
    (args.out/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print('Bundled', len(manifest['clips']), 'full recordings.')


if __name__ == '__main__':
    main()
