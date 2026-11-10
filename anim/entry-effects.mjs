// Landing effects drawn on the canvas: pure functions of the animation clock, so skipping or seeking draws the same frame.
// Each takes (ctx, p, sc): p runs 0 to 1 over the effect's life and sc scales it; the origin is the landing point.
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const COL=['#ffd34d','#ff8a5c','#fff3cf','#6cc8ff','#ff6fa1'];
const OUT='#3a2a1c';
function star(ctx,r,fill){ctx.beginPath();for(let k=0;k<4;k++){const aa=k*Math.PI/2;ctx.lineTo(Math.cos(aa)*r,Math.sin(aa)*r);ctx.lineTo(Math.cos(aa+Math.PI/4)*r*.38,Math.sin(aa+Math.PI/4)*r*.38)}ctx.closePath();ctx.lineWidth=2.2;ctx.strokeStyle=OUT;ctx.lineJoin='round';ctx.stroke();ctx.fillStyle=fill;ctx.fill()}
function heart(ctx,r,fill){ctx.beginPath();ctx.moveTo(0,r*.9);ctx.bezierCurveTo(-r*1.6,-r*.1,-r*.7,-r*1.1,0,-r*.4);ctx.bezierCurveTo(r*.7,-r*1.1,r*1.6,-r*.1,0,r*.9);ctx.closePath();ctx.lineWidth=2;ctx.strokeStyle=OUT;ctx.lineJoin='round';ctx.stroke();ctx.fillStyle=fill;ctx.fill()}
function glint(ctx,r,fill){ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.14,-r*.14,r,0);ctx.quadraticCurveTo(r*.14,r*.14,0,r);ctx.quadraticCurveTo(-r*.14,r*.14,-r,0);ctx.quadraticCurveTo(-r*.14,-r*.14,0,-r);ctx.closePath();ctx.lineWidth=1.4;ctx.strokeStyle='rgba(120,90,20,.7)';ctx.stroke();ctx.fillStyle=fill;ctx.fill()}
export const STACK_FX={
 stars(ctx,x,y,p,sc){const n=8;for(let i=0;i<n;i++){const a=-Math.PI*.92+i*(Math.PI*.84/(n-1));const sp=(42+rnd(i,1)*26)*sc;const px=Math.cos(a)*sp*p*1.1,py=Math.sin(a)*sp*p+34*sc*p*p*1.6;ctx.save();ctx.globalAlpha=1-p*p;ctx.translate(px,py);ctx.rotate(p*3+i);star(ctx,(11-p*6)*sc*(i%2?1:.8),COL[i%COL.length]);ctx.restore()}},
 dust(ctx,x,y,p,sc){for(const d of[-1,1])for(let j=0;j<3;j++){const q=clamp(p*1.1-j*.07,0,1);if(q<=0)continue;ctx.save();ctx.globalAlpha=(1-q)*.85;ctx.fillStyle='#f3e6cf';ctx.strokeStyle='rgba(90,64,40,.55)';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(d*(16+q*(34+j*13))*sc,-2*sc-j*3*sc*q,(7+q*10)*sc*(1-j*.15),0,7);ctx.fill();ctx.stroke();ctx.restore()}},
 sparkle(ctx,x,y,p,sc){for(let i=0;i<8;i++){const ph=clamp((p-i*.06)/.5,0,1);if(ph<=0||ph>=1)continue;const a=rnd(i,2)*Math.PI*2,d=(14+rnd(i,3)*34)*sc;const s=Math.sin(Math.PI*ph);ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.8-8*sc);ctx.rotate(ph*1.2);ctx.globalAlpha=Math.min(1,s*1.4);glint(ctx,(6+9*rnd(i,4))*sc*s,i%3?'#fff8d6':'#ffe27a');ctx.restore()}},
 confetti(ctx,x,y,p,sc){for(let i=0;i<16;i++){const a=-Math.PI*.5+(rnd(i,5)-.5)*2.3,sp=(60+rnd(i,6)*60)*sc;const px=Math.cos(a)*sp*p,py=Math.sin(a)*sp*p+120*sc*p*p;ctx.save();ctx.globalAlpha=1-Math.pow(p,2.2);ctx.translate(px,py);ctx.rotate(p*(5+rnd(i,7)*6)+i);ctx.fillStyle=COL[i%COL.length];ctx.strokeStyle=OUT;ctx.lineWidth=1.2;if(i%3===0){ctx.beginPath();ctx.arc(0,0,3.2*sc,0,7);ctx.fill();ctx.stroke()}else{ctx.fillRect(-4*sc,-2.2*sc,8*sc,4.4*sc);ctx.strokeRect(-4*sc,-2.2*sc,8*sc,4.4*sc)}ctx.restore()}},
 splash(ctx,x,y,p,sc){for(let i=0;i<9;i++){const a=-Math.PI*.5+(i-4)*.32+(rnd(i,8)-.5)*.2,sp=(50+rnd(i,9)*34)*sc;const px=Math.cos(a)*sp*p,py=Math.sin(a)*sp*p+150*sc*p*p;ctx.save();ctx.globalAlpha=1-Math.pow(p,2);ctx.translate(px,py);ctx.rotate(Math.atan2(py,px)+Math.PI/2+Math.PI);ctx.fillStyle='#8fd8ff';ctx.strokeStyle='#2f6f9a';ctx.lineWidth=1.6;const r=(4.5+rnd(i,10)*2.5)*sc;ctx.beginPath();ctx.moveTo(0,-r*1.7);ctx.bezierCurveTo(r*1.1,-r*.3,r*1,r,0,r);ctx.bezierCurveTo(-r*1,r,-r*1.1,-r*.3,0,-r*1.7);ctx.fill();ctx.stroke();ctx.restore()}
  ctx.save();ctx.globalAlpha=(1-p)*.8;ctx.strokeStyle='#e9fbff';ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(0,2,(14+p*40)*sc,(4+p*8)*sc,0,0,7);ctx.stroke();ctx.restore()},
 hearts(ctx,x,y,p,sc){for(let i=0;i<5;i++){const q=clamp((p-i*.07)/.85,0,1);if(q<=0)continue;const px=(i-2)*16*sc+Math.sin(q*6+i)*7*sc,py=-q*(48+rnd(i,11)*22)*sc;ctx.save();ctx.globalAlpha=Math.min(1,(1-q)*2);ctx.translate(px,py);ctx.scale(.6+q*.5,.6+q*.5);heart(ctx,(9+rnd(i,12)*3)*sc,i%2?'#ff6f8f':'#ff9db5');ctx.restore()}}
};



export const SETTLE_FX={
 hard(ctx,p,sc){const f=Math.pow(1-p,1.3);ctx.save();
  for(const d of[-1,1]){for(let j=0;j<2;j++){const q=clamp(p*1.15-j*.12,0,1);if(q<=0)continue;ctx.globalAlpha=f*.9;ctx.fillStyle='#f6ecd8';ctx.strokeStyle='rgba(90,64,40,.35)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(d*(18+q*(26+j*12))*sc,-3*sc-q*5*sc,(5+q*7)*sc*(1-j*.2),0,7);ctx.fill();ctx.stroke()}
   ctx.globalAlpha=f*.7;ctx.strokeStyle='#8a6a44';ctx.lineWidth=2.2*sc;ctx.lineCap='round';
   for(let i=0;i<3;i++){const ang=(-8-i*15)*Math.PI/180,r0=(26+p*8)*sc,r1=(37+p*14)*sc;ctx.beginPath();ctx.moveTo(d*Math.cos(ang)*r0,Math.sin(ang)*r0);ctx.lineTo(d*Math.cos(ang)*r1,Math.sin(ang)*r1);ctx.stroke()}}
  ctx.restore()},
 grass(ctx,p,sc){const f=Math.pow(1-p,1.2);const G=['#4f8f35','#7cc04f','#3b742a','#9ad36a'];ctx.save();
  for(let i=0;i<10;i++){const a=-Math.PI*.5+(i-4.5)*.28+(rnd(i,21)-.5)*.2,sp=(34+rnd(i,22)*30)*sc,px=Math.cos(a)*sp*p,py=Math.sin(a)*sp*p+70*sc*p*p;ctx.globalAlpha=f;ctx.save();ctx.translate(px*1.15,py);ctx.rotate(a+p*5+i);ctx.fillStyle=G[i%G.length];ctx.strokeStyle='rgba(30,70,20,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,(5.5-p*2)*sc,(2.2)*sc,0,0,7);ctx.fill();ctx.stroke();ctx.restore()}
  ctx.globalAlpha=f*.5;ctx.fillStyle='#d9e8c4';for(const d of[-1,1]){ctx.beginPath();ctx.arc(d*(20+p*22)*sc,-3*sc,(4+p*6)*sc,0,7);ctx.fill()}ctx.restore()},
 sand(ctx,p,sc){const f=Math.pow(1-p,1.2);const S=['#d6ad5f','#c4963f','#e8cf94'];ctx.save();
  for(let i=0;i<18;i++){const side=i%2?1:-1,a=(-12-rnd(i,23)*55)*Math.PI/180,sp=(40+rnd(i,24)*38)*sc,px=side*Math.cos(a)*sp*p+side*14*sc,py=-Math.sin(-a)*sp*p+110*sc*p*p;ctx.globalAlpha=f;ctx.fillStyle=S[i%3];ctx.beginPath();ctx.arc(px,py-2*sc,(1.8+rnd(i,25)*1.8)*sc,0,7);ctx.fill()}
  ctx.globalAlpha=f*.65;ctx.fillStyle='#ecdcb0';for(const d of[-1,1]){ctx.beginPath();ctx.arc(d*(20+p*24)*sc,-3*sc,(4.5+p*6)*sc,0,7);ctx.fill()}ctx.restore()},
 snow(ctx,p,sc){const f=Math.pow(1-p,1.2);ctx.save();
  for(const d of[-1,1])for(let j=0;j<3;j++){const q=clamp(p*1.1-j*.08,0,1);if(q<=0)continue;ctx.globalAlpha=f*.95;ctx.fillStyle='#ffffff';ctx.strokeStyle='rgba(110,150,195,.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(d*(16+q*(22+j*11))*sc,-4*sc-q*(8+j*4)*sc,(5+q*6)*sc*(1-j*.15),0,7);ctx.fill();ctx.stroke()}
  for(let i=0;i<8;i++){const a=-Math.PI*.5+(i-3.5)*.3,sp=(30+rnd(i,26)*30)*sc,px=Math.cos(a)*sp*p,py=Math.sin(a)*sp*p+50*sc*p*p;ctx.globalAlpha=f;ctx.fillStyle='#fff';ctx.strokeStyle='rgba(110,150,195,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(px,py,2.2*sc,0,7);ctx.fill();ctx.stroke()}ctx.restore()},
 bubbles(ctx,p,sc){const f=Math.pow(1-p,1.1);ctx.save();ctx.strokeStyle='rgba(235,252,255,.9)';ctx.lineWidth=2.2*sc;
  for(let j=0;j<2;j++){const q=clamp(p*1.1-j*.18,0,1);if(q<=0)continue;ctx.globalAlpha=f*(1-j*.3);ctx.beginPath();ctx.ellipse(0,-1,(14+q*(40+j*16))*sc,(3+q*6)*sc,0,0,7);ctx.stroke()}
  for(let i=0;i<6;i++){const q=clamp((p-i*.05)/.9,0,1);if(q<=0)continue;ctx.globalAlpha=f;ctx.fillStyle='rgba(220,245,255,.35)';ctx.beginPath();ctx.arc((i-2.5)*13*sc+Math.sin(q*6+i)*4*sc,-q*(34+rnd(i,27)*24)*sc,(2.6+rnd(i,28)*2.4)*sc,0,7);ctx.fill();ctx.stroke()}ctx.restore()}
};

export const STACK_FX_LIFE = 0.85;
export const SETTLE_FX_LIFE = 0.8;
// surface is what landingSurfaceFor gives: hard, grass, sand, snow, bubbles, dust (space) or water.
export function drawStackEffect(ctx, { kind, x, y, age, sc }) {
  const fn = STACK_FX[kind] || STACK_FX.stars;
  if (!(age > 0 && age < STACK_FX_LIFE)) return;
  ctx.save(); ctx.translate(x, y); fn(ctx, x, y, age / STACK_FX_LIFE, sc); ctx.restore();
}
export function drawSettleEffect(ctx, { surface, x, y, age, sc }) {
  const fn = SETTLE_FX[surface === 'water' ? 'bubbles' : surface] || SETTLE_FX.hard;
  if (!(age > 0 && age < SETTLE_FX_LIFE)) return;
  ctx.save(); ctx.translate(x, y); fn(ctx, age / SETTLE_FX_LIFE, sc); ctx.restore();
}
