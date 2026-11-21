// Aquarium motion stays inside the water; the restaurant furniture and tank frame never move.
export function drawAquarium(ctx, images, tank, { x, y, width, height, time = 0, reduced = false }) {
  const [x0,y0,x1,y1]=tank.box, tx=x+x0*width, ty=y+y0*height, tw=(x1-x0)*width, th=(y1-y0)*height;
  if(tx>ctx.canvas.width || tx+tw<0 || ty>ctx.canvas.height || ty+th<0) return;
  ctx.save();ctx.beginPath();ctx.rect(tx,ty,tw,th);ctx.clip();
  if(!reduced){
    // Small glints travel along the surface, with a gentle blue light through the water.
    ctx.strokeStyle='rgba(206,255,255,.24)';ctx.lineWidth=Math.max(.5,tw*.008);
    for(let i=0;i<3;i++){
      const px=tx+tw*(.2+i*.29)+Math.sin(time*.7+i*2)*tw*.045;
      ctx.beginPath();ctx.ellipse(px,ty+th*(.045+i*.018),tw*.13,th*.02,0,0,Math.PI*2);ctx.stroke();
    }
    for(let lane=0;lane<3;lane++)for(let n=0;n<3;n++){
      const phase=(time*(.14+lane*.025)+n/3+lane*.21)%1;
      const bx=tx+tw*(.14+lane*.34)+Math.sin(time*1.1+n+lane)*tw*.018;
      const by=ty+th*(1-phase), radius=Math.max(.45,tw*(.008+n*.003));
      ctx.strokeStyle=`rgba(203,255,255,${.15+.4*Math.sin(phase*Math.PI)})`;
      ctx.lineWidth=Math.max(.45,tw*.007);ctx.beginPath();ctx.arc(bx,by,radius,0,Math.PI*2);ctx.stroke();
    }
  }
  for(const fish of tank.fish){
    const image=images[fish.img];if(!image)continue;
    const fw=fish.w*tw, fh=fw*image.naturalHeight/image.naturalWidth;
    const dir=fish.speed<0?-1:1;
    // Advance forwards in the fish's own direction, including left-facing swimmers.
    const u=((fish.phase+(reduced?0:time*Math.abs(fish.speed)*1.5))%1+1)%1;
    const fx=tx-fw/2+(dir>0?u:1-u)*(tw+fw);
    const fy=ty+fish.y*th+(reduced?0:Math.sin(time*1.6+fish.phase*9)*th*.045);
    ctx.save();ctx.translate(fx,fy);ctx.scale(dir,1);
    if(reduced){ctx.drawImage(image,-fw/2,-fh/2,fw,fh);}else{
      // The tail pivots at its root; the face and body remain anchored.
      const split=image.naturalWidth*.3, root=-fw*.2;
      ctx.save();ctx.translate(root,0);ctx.rotate(Math.sin(time*9+fish.phase*13)*.16);
      ctx.drawImage(image,0,0,split+1,image.naturalHeight,-fw*.3,-fh/2,fw*.3+fw/image.naturalWidth,fh);ctx.restore();
      ctx.drawImage(image,split,0,image.naturalWidth-split,image.naturalHeight,root,-fh/2,fw*.7,fh);
    }
    ctx.restore();
  }
  ctx.restore();
}
