"""Recover already generated source files; no image modification."""
import json, shutil
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=root/'art-source/monthly-expansion-55'
files=json.loads((root/'output/monthly-expansion-55/recovery-files.json').read_text())
ids='snowman ice-skates skis rose-petal football-tv wedding-ring heart-balloon rainbow-kite irish-harp clover-cookie green-top-hat bagpipes rain-boot baby-lamb watering-can flower-pot butterfly apple-with-worm sunflower-bouquet garden-trowel tie-dye-shirt tamale bicycle-bell graduation-cap serape camping-lantern picnic-basket apple-pie barbecue-tongs sparkling-lemonade bald-eagle'.split()
entries={Path(e['file']).stem:e for e in json.loads((source/'requested-prompts.json').read_text())}
records=source/'records';records.mkdir(exist_ok=True)
for f,id in zip(files,ids):
    target=source/(id+'.png')
    record=records/(id+'.json')
    if not target.exists():shutil.copy2(f['file'],target)
    if not record.exists():
        record.write_text(json.dumps({**entries[id], 'generated':f['file'], 'stylePass':'initial draft; pending simplification review'},indent=2)+'\n')
print(f'Recovered {len(ids)} source images and records')
