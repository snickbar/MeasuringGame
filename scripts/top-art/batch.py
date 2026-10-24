import sys,json;sys.path.insert(0,'/home/claude/snickbar/measuringgame/scripts/top-art')
from reg import *
pairs=[('ants','antennae','no-antennae','hero'),('sunflower','wings','no-wings','hero'),('games','top-slice','no-top-slice','hero'),('snacks','leaves','no-leaves','hero'),
('town','flag','no-flag','hero'),('corgi','ears','no-ears','hero'),('corgi','tail','no-tail','hero'),('giraffe','ears','no-ears','hero'),('giraffe','tail','no-tail','hero'),
('dragon','wings','no-wings','hero'),('penguin','flipper','no-flipper','hero'),('underwater','flipper','no-flipper','hero'),('toy-box','arm','no-arm','hero'),
('space','arm','no-arm','hero'),('cactus','top-hat','no-top-hat','hero')]
for sc,p,b,k in pairs:
    try:
        ref=hero(sc,k);base=piece(f'{sc}-{b}');rb=register(base,ref)
        if not rb: print(sc,p,'BASE REG FAIL');continue
        r=solve_part(sc,p,b,k)
        fpa=int((r['fp']>0).sum())
        print(f"{sc:10} {p:9} base s={rb['scale']:.3f} t=({rb['tx']:.1f},{rb['ty']:.1f}) inl={rb['inliers']} | footprint={fpa:6} fit scale={r['fit']['scale']:.3f} iou={r['fit']['iou']:.2f}")
    except Exception as e: print(sc,p,'ERR',repr(e)[:100])
