"""Second suspense audition: new builds and endings, without changing game audio."""
import hashlib
import json
import pathlib
import wave
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = pathlib.Path('C:/Projects/assets')
OUT = ROOT / 'anim/sound-suspense/audio'
OUT.mkdir(parents=True, exist_ok=True)
RATE, BUILD = 48000, 2.3  # Match the existing flair suspense interval.
manifest = []

def read(relative):
    source = ASSETS / relative
    with wave.open(str(source), 'rb') as w:
        width, channels, rate = w.getsampwidth(), w.getnchannels(), w.getframerate()
        raw = w.readframes(w.getnframes())
    if width == 3:
        b = np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(np.int32)
        n = b[:, 0] | b[:, 1] << 8 | b[:, 2] << 16
        x = np.where(n & 0x800000, n - 0x1000000, n) / 8388608.
    else:
        assert width == 2
        x = np.frombuffer(raw, '<i2') / 32768.
    x = x.reshape(-1, channels).mean(axis=1)
    # High-quality band-limited interpolation using a finite windowed-sinc filter.
    if rate != RATE:
        positions = np.arange(int(len(x) * RATE / rate)) * rate / RATE
        center = np.floor(positions).astype(int)
        total = np.zeros(len(positions)); weight = np.zeros(len(positions))
        cutoff = min(1., RATE / rate)
        for k in range(-24, 25):
            index = center + k; d = positions - index
            w = cutoff * np.sinc(d * cutoff) * (.5 + .5 * np.cos(np.pi * d / 25))
            valid = (index >= 0) & (index < len(x))
            total[valid] += x[index[valid]] * w[valid]; weight[valid] += w[valid]
        x = total / np.maximum(weight, 1e-9)
    active = np.flatnonzero(np.abs(x) > np.max(np.abs(x)) * .008)
    x = x[max(0, active[0] - 300):min(len(x), active[-1] + 1800)]
    return x, {'source': relative, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}

def add(target, hit, time, gain=1):
    start = int(time * RATE)
    n = min(len(hit), len(target) - start)
    if n > 0:
        target[start:start+n] += hit[:n] * gain

def normalize(x, rms=.10):
    peak = float(np.max(np.abs(x)))
    assert peak > 0
    return x * min(6., rms / max(float(np.sqrt(np.mean(x*x))), .00001), .68 / peak)

def save(name, x, sources, processing):
    x = normalize(x)
    a, b = min(len(x), 240), min(len(x), 1920)
    x[:a] *= np.linspace(0, 1, a); x[-b:] *= np.linspace(1, 0, b)
    file = OUT / (name + '.wav')
    with wave.open(str(file), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((x * 32767).astype('<i2').tobytes())
    sha = hashlib.sha256(file.read_bytes()).hexdigest()
    manifest.append({'file':file.relative_to(ROOT).as_posix(), 'sources':sources,
                     'processing':processing, 'sha256':sha})
    return {'file':file.relative_to(ROOT).as_posix(), 'gain':.85,
            'duration':round(len(x)/RATE, 3), 'sha256':sha}

rng = np.random.default_rng(221022)
def snare(length=.13):
    t = np.arange(int(RATE * length))/RATE
    noise = rng.normal(0, 1, len(t))
    high = np.r_[0, np.diff(noise)] * .30
    attack = np.minimum(t/.002, 1)
    return (high*np.exp(-t*48)+.20*np.sin(2*np.pi*185*t)*np.exp(-t*35)
            +.08*np.sin(2*np.pi*330*t)*np.exp(-t*45))*attack

builds = []
x = np.zeros(int(RATE*BUILD))
for i, time in enumerate(np.arange(.025, BUILD-.06, .042)):
    progress = time/BUILD
    add(x, snare(), time, (.20+.80*progress**1.5)*(1 if i%2 else .78))
builds.append(('Soft snare roll', 'A newly made snare-style roll that grows louder. No rattles or gears.',
               save('snare-roll', x, [], 'Seeded noise + decaying drum tones; 42ms alternating strokes, crescendo; mono PCM/fades'), 'New percussion design'))

hit, provenance = read('FilmCow SFX - Bowls/bowl hit with drumstick 2.wav')
hit = normalize(hit)[:int(RATE*.12)]
hit[-900:] *= np.linspace(1,0,900)
x = np.zeros(int(RATE*BUILD)); time=.04; i=0
while time < BUILD-.10:
    progress=time/BUILD; add(x, hit, time, .30+.7*progress)
    time += .13-.09*progress; i+=1
builds.append(('Percussion crescendo', 'Recorded drumstick strikes, getting faster and stronger.',
               save('percussion-roll', x, [provenance], 'Repeated trimmed drumstick-on-bowl recording, accelerating crescendo; mono PCM/fades'), 'FilmCow · edited percussion'))

hit, provenance = read('CrispCozy_Sampler/WAV/Buttons/tap_wood_01.wav')
hit=normalize(hit)[:int(RATE*.065)]; hit[-700:] *= np.linspace(1,0,700)
x=np.zeros(int(RATE*BUILD)); time=.025
while time < BUILD-.07:
    progress=time/BUILD; add(x, hit, time, .35+.65*progress)
    time += .23-.195*progress
builds.append(('Accelerating ticks', 'A measured tick that speeds up toward the reveal.',
               save('ticking-build', x, [provenance], 'Trimmed wooden tap, accelerating 230–35ms spacing and crescendo; mono PCM/fades'), 'Crisp Cozy · edited rhythm'))

for filename,title,description in [
    ('music_box_mystery', 'Music-box mystery', 'A musical mystery phrase with a short pause before the reveal.'),
    ('vibraphone_mystery', 'Vibraphone suspense', 'A ringing musical alternative to a drumroll.'),
    ('brass_mystery', 'Brass anticipation', 'A short game-show-style musical question.')]:
    phrase,provenance=read('Musical Effects/'+filename+'.wav')
    x=np.zeros(int(RATE*BUILD)); add(x,phrase,.025)
    builds.append((title,description,save(filename,x,[provenance],'Original phrase, padded to existing 2.3s suspense interval; mono PCM/fades'), 'Musical Effects'))

ends=[]
for filename,title,description in [
    ('music_box_chime_quick','Soft chime','A short music-box accent with a faded tail.'),
    ('brass_chime_quick','Brass reveal','A brief brass finish.')]:
    x,provenance=read('Musical Effects/'+filename+'.wav');x=x[:int(RATE*.8)]
    ends.append((title,description,save(filename,x,[provenance],'Trim to at most 0.8s; mono PCM, balanced gain and fades'),'Musical Effects'))
t=np.arange(int(RATE*.32))/RATE
x=np.zeros(len(t)); hit=snare(.2); add(x,hit,0,.6)
x+=.5*np.sin(2*np.pi*(105*t-90*t*t))*np.exp(-t*23)
ends.append(('Drum accent','A short drum hit to finish the roll.',save('drum-accent',x,[],'Seeded snare noise + decaying pitched drum; mono PCM/fades'),'New percussion design'))

live=json.loads((ROOT/'anim/sound-review-data.json').read_text(encoding='utf-8'))
rows=[]
for id,options in [('drumroll',builds),('drumroll-end',ends)]:
    row={k:v for k,v in next(r for r in live['rows'] if r['id']==id).items() if k!='callSites'}
    row['description']=('The short build while the winning guess and flair are about to be revealed.' if id=='drumroll'
                        else 'The final accent as the reveal lands. Choose it separately from the build.')
    row['options']=[{'id':chr(97+i),'title':title,'description':description,'sourcePack':pack,'events':[event]}
                    for i,(title,description,event,pack) in enumerate(options)]
    row['optionsFingerprint']=hashlib.sha256(json.dumps(row['options'],sort_keys=True).encode()).hexdigest()[:16]
    if id=='drumroll-end': row['defaultPreviewOption']='a'
    rows.append(row)
previous=json.loads((ROOT/'anim/sound-options-data.json').read_text(encoding='utf-8'))
data={'version':1,'set':'suspense-2','baselineExportedAt':'2026-10-22T22:27:05.730Z',
      'rows':rows,'kept':[r['id'] for r in previous['baseline'] if r['choice']=='keep'],
      'undecided':[{'id':r['id'],'title':r['title'],'fingerprint':r['fingerprint']} for r in live['rows'] if r['id'] in ['start','anim-tap','anim-tick']]}
(ROOT/'anim/sound-suspense-data.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
(ROOT/'art-source/sound-review-2026-10-22/suspense-2-sources.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('Built 6 new 2.3-second builds and 3 endings. Game sounds unchanged.')
