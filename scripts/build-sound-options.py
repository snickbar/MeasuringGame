"""Build review clips from the user's asset library; never modify game sounds."""
import argparse
import hashlib
import json
import pathlib
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--assets', default='C:/Projects/assets')
parser.add_argument('--picks', required=True)
args = parser.parse_args()
assets = pathlib.Path(args.assets)
baseline = json.loads(pathlib.Path(args.picks).read_text(encoding='utf-8-sig'))
data = json.loads((ROOT / 'anim/sound-review-data.json').read_text(encoding='utf-8'))
assert baseline['type'] == 'size-em-up-sound-review' and baseline['version'] == 1
by_id = {r['id']: r for r in data['rows']}
assert len(baseline['decisions']) == len(by_id) == len({r['id'] for r in baseline['decisions']})
assert all(r['fingerprint'] == by_id[r['id']]['fingerprint'] for r in baseline['decisions'])
archive = ROOT / 'art-source/sound-review-2026-10-22'
archive.mkdir(parents=True, exist_ok=True)
(archive / 'round-1.json').write_text(json.dumps(baseline, indent=2) + '\n')

# Each entry is a different source cue, rather than three pitch changes of one cue.
# Source paths and processing are retained so approved options can be applied by role.
selections = {
 'swipe': [
  ('Capsule clack', 'A small hard capsule hitting wood.', 'FilmCow SFX - Bottle Caps/cap dropped on wood 2.wav', 1.0),
  ('Soft pop', 'A short rounded pop for each capsule.', 'UI/pop_2.wav', 1.0),
  ('Quick swoosh', 'A quick air movement instead of a landing clack.', 'Other/whoosh_1.wav', 1.0)],
 'shuffle': [
  ('Real capsule machine', 'A recorded gumball-machine mechanism.', 'FilmCow SFX - Mechanisms & Movement/gumball machine 1.wav', 3.2),
  ('Dice rattle', 'A short tabletop rattle.', 'Card and Board/dice_shake_2.wav', 2.0),
  ('Turning gears', 'A compact mechanical winding sound.', 'FilmCow SFX - Mechanisms & Movement/small gear mechanism 2.wav', 2.0)],
 'drumroll': [
  ('Rolling beads', 'A physical rolling build. The ending is chosen separately.', 'FilmCow SFX - Beads & Sand/beads spinning around bowl 1.wav', 3.2),
  ('Tabletop suspense', 'A short dice shake. The ending is chosen separately.', 'Card and Board/dice_shake_3.wav', 2.0),
  ('Mechanical suspense', 'A capsule-machine build. The ending is chosen separately.', 'FilmCow SFX - Mechanisms & Movement/gumball machine 3.wav', 3.2)],
 'drumroll-end': [
  ('Glass ding', 'A real glass accent to finish the suspense.', 'FilmCow Recorded SFX/glass ding 1.wav', 1.8),
  ('Xylophone finish', 'A short musical finish.', 'Musical Effects/xylophone_chime_quick.wav', 2.0),
  ('Capsule pop', 'A brief physical pop instead of a chime.', 'FilmCow SFX - Mechanisms & Movement/tin pop 2.wav', 1.0)],
 'avatar-ultra': [
  ('Music-box discovery', 'A longer musical unlock cue.', 'Musical Effects/music_box_positive_long.wav', 4.0),
  ('Vibraphone discovery', 'A ringing musical reward.', 'Musical Effects/vibraphone_positive_long.wav', 4.0),
  ('Arcade power-up', 'A short retro upgrade.', 'Retro/power_up.wav', 3.0)],
 'win': [
  ('Brass celebration', 'A full musical finish for a game win.', 'Musical Effects/brass_level_complete.wav', 5.0),
  ('Bright xylophone', 'A lighter musical finish.', 'Musical Effects/xylophone_level_complete.wav', 5.0),
  ('Audience applause', 'A short burst of applause instead of a melody.', 'Other/applause.wav', 3.5)],
 'roundwin': [
  ('Quick xylophone', 'A small musical reward for a round or award.', 'Musical Effects/xylophone_chime_positive.wav', 2.0),
  ('Steel-drum reward', 'A different instrument for the same moment.', 'Musical Effects/steel_drums_chime_positive.wav', 2.0),
  ('Piano reward', 'A brief piano cue.', 'Musical Effects/grand_piano_chime_positive.wav', 2.0)],
 'leave': [
  ('Quiet whoosh', 'An air movement without a negative melody.', 'Other/whoosh_2.wav', 1.2),
  ('Soft departure', 'A short musical departure cue.', 'Musical Effects/music_box_negative_quick.wav', 2.0),
  ('Toggle off', 'A small interface sound.', 'UI/toggle_off.wav', 1.2)],
 'streak': [
  ('Xylophone run', 'A longer reward than the single-round chime.', 'Musical Effects/xylophone_positive_long.wav', 3.0),
  ('Brass streak', 'A more emphatic musical reward.', 'Musical Effects/brass_positive_long.wav', 3.0),
  ('Steel-drum streak', 'A playful musical run.', 'Musical Effects/steel_drums_positive_long.wav', 3.0)],
 'winner': [
  ('Music-box reveal', 'A ringing cue as the top performer appears.', 'Musical Effects/music_box_chime_positive.wav', 2.5),
  ('Brass reveal', 'A short brass accent.', 'Musical Effects/brass_chime_positive.wav', 2.0),
  ('Vibraphone reveal', 'A longer ringing accent.', 'Musical Effects/vibraphone_chime_positive.wav', 2.5)],
 'start': [
  ('Xylophone opening', 'A musical opening for the game.', 'Musical Effects/xylophone_level_start.wav', 4.0),
  ('Brass opening', 'A more emphatic start.', 'Musical Effects/brass_level_start.wav', 4.0),
  ('Quick confirmation', 'A compact interface confirmation.', 'UI/synth_confirmation.wav', 2.0)],
 'powerup': [
  ('Item discovery', 'A magical collectible cue.', 'Items/gem_collect.wav', 2.5),
  ('Music-box alert', 'A short musical attention cue.', 'Musical Effects/music_box_chime_quick.wav', 2.0),
  ('Retro upgrade', 'A short arcade-style power-up.', 'Retro/power_up_2.wav', 2.5)],
 'coins': [
  ('Coin jingle', 'A compact jingle for the reward sequence.', 'Items/coin_jingle_small.wav', 2.0),
  ('Gathered coins', 'A short handful of coins.', 'Items/coins_gather_medium.wav', 2.0),
  ('Real coins in a bowl', 'A recorded physical coin reward.', 'FilmCow SFX - Bowls/coins added to bowl 1.wav', 2.0)],
 'best': [
  ('Piano personal best', 'A longer piano reward for an improvement.', 'Musical Effects/grand_piano_positive_long.wav', 3.0),
  ('Music-box personal best', 'A ringing reward for a new record.', 'Musical Effects/music_box_level_complete.wav', 5.0),
  ('Vibraphone personal best', 'A more sustained musical reward.', 'Musical Effects/vibraphone_level_complete.wav', 5.0)],
 'anim-cardflip': [
  ('Paper turn', 'A paper movement for the final partial object.', 'Items/page_turn.wav', 1.2),
  ('Card flick', 'A shorter card movement.', 'Card and Board/card_draw_1.wav', 1.0),
  ('Air flick', 'A quick swoosh instead of paper.', 'FilmCow Recorded SFX/swoosh 1.wav', 1.0)],
 'hs-laugh': [
  ('Slide-whistle bluff', 'A cartoon reaction instead of a synthetic laugh.', 'FilmCow Recorded SFX/slide whistle 2.wav', 1.5),
  ('Elastic twang', 'A playful physical reaction.', 'Other/elastic_twang.wav', 2.0),
  ('Arcade wobble', 'A short retro reaction.', 'Retro/wobble.wav', 2.0)],
}

out = ROOT / 'anim/sound-options/audio'
out.mkdir(parents=True, exist_ok=True)
manifest = []

def clip(relative, filename, limit):
    source = assets / relative
    raw = source.read_bytes()
    with wave.open(str(source), 'rb') as w:
        width, channels, rate = w.getsampwidth(), w.getnchannels(), w.getframerate()
        frames = w.readframes(w.getnframes())
    if width == 3:
        b = np.frombuffer(frames, dtype=np.uint8).reshape(-1, 3).astype(np.int32)
        values = b[:, 0] | b[:, 1] << 8 | b[:, 2] << 16
        values = np.where(values & 0x800000, values - 0x1000000, values) / 8388608.0
    elif width in (2, 4):
        values = np.frombuffer(frames, dtype='<i2' if width == 2 else '<i4') / float(2 ** (width * 8 - 1))
    else:
        raise ValueError('Unsupported PCM: ' + relative)
    values = values.reshape(-1, channels).mean(axis=1)
    peak = float(np.max(np.abs(values)))
    assert peak > 0, relative
    nonzero = np.flatnonzero(np.abs(values) > peak * .006)
    start = max(0, int(nonzero[0]) - int(rate * .015))
    end = min(len(values), int(nonzero[-1]) + int(rate * .06), start + int(limit * rate))
    values = values[start:end].copy()
    rms = float(np.sqrt(np.mean(values ** 2)))
    gain = min(4, .10 / max(rms, .00001), .68 / float(np.max(np.abs(values))))
    values *= gain
    # Small fades prevent edge clicks, including clips cut to suit a short UI moment.
    a, b = min(len(values), int(rate * .005)), min(len(values), int(rate * .035))
    values[:a] *= np.linspace(0, 1, a)
    values[-b:] *= np.linspace(1, 0, b)
    # Keep native sample rate: no low-quality resampling of 48 kHz recordings.
    target = out / filename
    with wave.open(str(target), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes((np.clip(values, -1, 1) * 32767).astype('<i2').tobytes())
    result = {'file': 'anim/sound-options/audio/' + filename, 'gain': .85,
              'duration': round(len(values) / rate, 3), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
    manifest.append({'file': result['file'], 'source': relative, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
                     'clipSha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'sourceRate': rate,
                     'trimStart': round(start / rate, 4), 'trimEnd': round(end / rate, 4),
                     'appliedGain': round(gain, 5), 'processing': 'mono, 16-bit PCM, silence trim, 5/35ms fades',
                     'sourcePack': relative.split('/')[0]})
    return result

rows = []
for decision in baseline['decisions']:
    if decision['choice'] != 'change':
        continue
    row = dict(by_id[decision['id']])
    row.pop('callSites', None)
    row['options'] = []
    for i, (title, description, source, limit) in enumerate(selections[row['id']]):
        event = clip(source, row['id'] + '-' + chr(97 + i) + '.wav', limit)
        row['options'].append({'id': chr(97 + i), 'title': title, 'description': description,
                               'sourcePack': source.split('/')[0], 'events': [event]})
    row['optionsFingerprint'] = hashlib.sha256(json.dumps(row['options'], sort_keys=True).encode()).hexdigest()[:16]
    rows.append(row)
assert len(rows) == len(selections) == 16
result = {'version': 1, 'baselineExportedAt': baseline['exportedAt'], 'baseline': baseline['decisions'], 'rows': rows,
          'kept': [r['id'] for r in baseline['decisions'] if r['choice'] == 'keep'],
          'undecided': [{k: by_id[r['id']][k] for k in ['id', 'title', 'fingerprint']} for r in baseline['decisions'] if r['choice'] is None]}
(ROOT / 'anim/sound-options-data.json').write_text(json.dumps(result, indent=2) + '\n')
(archive / 'candidate-sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Built {len(rows)} roles, {len(manifest)} clips, {sum(p.stat().st_size for p in out.glob("*.wav")) / 1024 / 1024:.1f} MiB; game audio unchanged.')
