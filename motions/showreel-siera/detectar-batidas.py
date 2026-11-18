"""Detecta as batidas de musica.mp3 e salva em batidas.json.

Uso (na pasta showreel-siera):  python detectar-batidas.py [musica.mp3]

O áudio é decodificado pelo ffmpeg (o PyAV desta máquina é incompatível) e analisado
com o librosa. O index.html encaixa os cortes de cena na batida mais próxima.
"""
import json
import subprocess
import sys
from pathlib import Path

import librosa
import numpy as np

AQUI = Path(__file__).resolve().parent
arquivo = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / 'musica.mp3'
SR = 22050

pcm = subprocess.run(
    ['ffmpeg', '-loglevel', 'error', '-i', str(arquivo), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
    check=True, capture_output=True).stdout
y = np.frombuffer(pcm, dtype=np.float32)
duracao = len(y) / SR

onset = librosa.onset.onset_strength(y=y, sr=SR)
tempo, quadros = librosa.beat.beat_track(onset_envelope=onset, sr=SR, units='frames')
tempo = float(np.atleast_1d(tempo)[0])
batidas = librosa.frames_to_time(quadros, sr=SR)

# força de cada batida (para achar o "1" do compasso)
forca = onset[np.clip(quadros, 0, len(onset) - 1)]
fase = int(np.argmax([forca[f::4].mean() if len(forca[f::4]) else 0 for f in range(4)]))
compassos = batidas[fase::4]

saida = {
    'arquivo': arquivo.name,
    'duracao': round(duracao, 3),
    'bpm': round(tempo, 2),
    'batidas': [round(float(b), 3) for b in batidas],
    'compassos': [round(float(b), 3) for b in compassos],
    'forca': [round(float(f) / float(forca.max() or 1), 3) for f in forca],
}
(AQUI / 'batidas.json').write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(batidas)} batidas | {tempo:.1f} BPM | {duracao:.1f} s -> batidas.json')
