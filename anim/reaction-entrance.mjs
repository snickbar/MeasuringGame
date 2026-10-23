// This is a separate entrance layer: each reaction keeps its own growth/motion,
// and the existing stage lifetime still controls its hold and exit unchanged.
export function reactionEntrance({left,size,cardLeft,cardRight,outward= -1}) {
 const edge=outward<0?cardLeft:cardRight,center=left+size/2;
 const toward=outward<0?1:-1;
 const distance=Math.min(size*.65,Math.max(18,(edge-center)*toward+size*.06));
 const shift=toward*distance,start=left+shift;
 const clipped=Math.min(size,Math.max(0,outward<0?start+size-edge:edge-start));
 return [
  {translate:`${shift}px 0`,opacity:.15,clipPath:outward<0?`inset(0 ${clipped}px 0 0)`:`inset(0 0 0 ${clipped}px)`},
  {translate:'0px 0',opacity:1,clipPath:'inset(0 0px 0 0px)'}
 ];
}
