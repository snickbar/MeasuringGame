# Squash the metal legs of the drive-in screen picture so the screen sits lower (run on the tall original).
from PIL import Image
src='art-source/drivein-screen-tall-original.webp'; out='anim/scenery/drivein-screen.webp'
im=Image.open(src).convert('RGBA'); W,H=im.size
a,b,k=780,1240,0.55
top=im.crop((0,0,W,a)); mid=im.crop((0,a,W,b)).resize((W,int((b-a)*k)),Image.LANCZOS); bot=im.crop((0,b,W,H))
n=Image.new('RGBA',(W,a+mid.height+bot.height),(0,0,0,0))
n.paste(top,(0,0)); n.paste(mid,(0,a)); n.paste(bot,(0,a+mid.height)); n.save(out,'WEBP',quality=80)
print(n.size, 'height ratio', n.height/H)
