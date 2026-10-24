import sys;sys.path.insert(0,'/home/claude/snickbar/measuringgame/scripts/top-art')
import verify
from reg import *
mode=sys.argv[5] if len(sys.argv)>5 else 'sil'
verify.solve_part=lambda sc,p,b,k='hero',**kw: solve_part2(sc,p,b,k,mode=mode)
box=tuple(map(int,sys.argv[4].split(','))) if len(sys.argv)>4 and sys.argv[4]!='-' else None
verify.run(sys.argv[1],sys.argv[2],sys.argv[3],box)
