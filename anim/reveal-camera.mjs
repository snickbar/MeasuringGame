const clamp=t=>Math.max(0,Math.min(1,t));
const mix=(a,b,t)=>a+(b-a)*t;
export function smootherCameraEase(t){t=clamp(t);return t*t*t*(10+t*(-15+6*t));}

// Debug-only framing. All sizes and vertical camera values come from the real reveal.
export function cameraLedFraming({phase,progress,width,gutter,initialStackX,initialScale,targetGapWorld,targetWidthWorld,scale,stackWidth,closeStackWidth}){
  const clearance=Math.max(24,Math.min(34,width*.085));
  const rightAnchor=initialStackX+(targetGapWorld+targetWidthWorld)*initialScale;
  const climbStackX=Math.max(gutter+closeStackWidth/2,rightAnchor-targetWidthWorld-closeStackWidth/2-clearance);
  let stackX,gap;
  if(phase==='in'){
    // Interpolate both endpoints together. Re-solving the packing every frame can
    // reverse direction when a very wide target first touches the viewport edge.
    stackX=mix(initialStackX,climbStackX,progress);
    gap=mix(targetGapWorld*initialScale,closeStackWidth/2+clearance,progress);
  }else if(phase==='out'){
    stackX=mix(climbStackX,initialStackX,progress);
    gap=mix(stackWidth/2+clearance,targetGapWorld*scale,progress);
  }else{
    stackX=climbStackX;gap=stackWidth/2+clearance;
  }
  return {sx0:stackX,targetGap:gap/scale};
}
