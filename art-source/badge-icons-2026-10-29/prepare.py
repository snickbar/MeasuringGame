"""Split the requested generated sheets; preserve the requested white backgrounds."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont
import json, shutil, zipfile

ROOT = Path(__file__).resolve().parent
SOURCE = Path('C:/Users/snick/.codex/generated_images/01a14698-8ce3-7d03-81d9-aa88b18a26dc')
SHEETS = [
 ('0ce427e2-03f8-4e15-bf33-76d5a00b456e', 'welcome account spotter-3 star-collector'),
 ('15b83e83-1a9d-4959-b0a1-a397c28bf607', 'team-spirit winning-combination travel-buddies perfect-partnership'),
 ('b6b2c10b-45ca-436c-9c85-6275b91bf2f7', 'holding-the-line in-sync at-the-table high-roller'),
 ('4651f50c-9cb0-4aa9-939c-2ba9206fe24e', 'called-your-bluff daily-regular ice-cold desert-survivor'),
 ('34195316-a714-4f20-bf34-4c38fe77c4cd', 'dragon-slayer head-above world-tiny world-games'),
 ('6aff5905-a812-49db-9f1f-2765abb79041', 'world-home world-food world-town world-critters'),
 ('c8af4e63-8538-4769-a7e2-15fdf429baef', 'world-wheels world-landmarks world-sea world-toybox'),
 ('6a996d56-8b17-4814-b482-8f145ae4aaae', 'world-makebelieve world-holiday month-01 month-02'),
 ('b7e23600-907d-4add-bd1e-5ea0a6d9fb1b', 'month-03 month-04 month-05 month-06'),
 ('68a8a412-a945-4eb7-a1b6-6dfe8352560d', 'month-07 month-08 month-09 month-10'),
 ('b094808d-ccad-46f6-9054-ee767fd291c7', 'month-11 month-12'),
]
(ROOT/'sheets').mkdir(exist_ok=True)
(ROOT/'icons').mkdir(exist_ok=True)
manifest = {'generator':'built-in image_gen', 'background':'white, as requested', 'size':[256,256], 'sheets':[], 'icons':[]}
for n,(source,names) in enumerate(SHEETS,1):
    original = SOURCE/f'exec-{source}.png'
    sheet_path = ROOT/'sheets'/f'sheet-{n:02}.png'
    shutil.copy2(original,sheet_path)
    im=Image.open(sheet_path).convert('RGB')
    names=names.split(); cols=2; rows=2 if len(names)==4 else 1
    manifest['sheets'].append({'file':str(sheet_path.relative_to(ROOT)), 'source':original.name, 'icons':names})
    for i,name in enumerate(names):
        x=i%cols; y=i//cols
        cell=im.crop((round(x*im.width/cols),round(y*im.height/rows),round((x+1)*im.width/cols),round((y+1)*im.height/rows)))
        # Threshold only locates content for the crop. Artwork colors are untouched.
        mask=ImageChops.difference(cell,Image.new('RGB',cell.size,'white')).convert('L').point(lambda a:255 if a>22 else 0)
        box=mask.getbbox(); assert box, name
        assert box[0]>0 and box[1]>0 and box[2]<cell.width and box[3]<cell.height, f'Art touches cut edge: {name}'
        art=cell.crop((max(0,box[0]-4),max(0,box[1]-4),min(cell.width,box[2]+4),min(cell.height,box[3]+4)))
        art.thumbnail((232,232),Image.Resampling.LANCZOS)
        final=Image.new('RGB',(256,256),'white'); final.paste(art,((256-art.width)//2,(256-art.height)//2))
        dest=ROOT/'icons'/f'{name}.png'; final.save(dest,optimize=True)
        manifest['icons'].append({'file':f'icons/{name}.png','sheet':n,'crop':list(box),'bytes':dest.stat().st_size})
assert len(manifest['icons'])==42
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
overview=Image.new('RGB',(1260,1440),'#f4efe5'); draw=ImageDraw.Draw(overview)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
for i,entry in enumerate(manifest['icons']):
    x=(i%7)*180; y=(i//7)*240
    icon=Image.open(ROOT/entry['file']); icon.thumbnail((132,132),Image.Resampling.LANCZOS)
    overview.paste(icon,(x+24,y+8)); draw.text((x+90,y+148),Path(entry['file']).stem,font=font,fill='#4a2c12',anchor='mt')
    small=Image.open(ROOT/entry['file']).resize((60,60),Image.Resampling.LANCZOS); overview.paste(small,(x+60,y+172))
overview.save(ROOT/'overview.jpg',quality=92)
with zipfile.ZipFile(ROOT/'badge-icons-42.zip','w',zipfile.ZIP_DEFLATED) as z:
    for path in sorted((ROOT/'icons').glob('*.png')):z.write(path,path.name)
print(f'Saved {len(manifest["icons"])} icons, 11 original sheets, overview, manifest and ZIP to {ROOT}')
