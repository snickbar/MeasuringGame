const fs=require('node:fs'),path=require('node:path'),{Jimp}=require('jimp');
const root=path.resolve(__dirname,'../art-source/monthly-unlocks-2026-11-04');
const entries=JSON.parse(fs.readFileSync(path.join(root,'prompts.json'),'utf8').replace(/^\uFEFF/,''));
const sheets={4:[4,2],8:[2,2],12:[2,2],26:[3,2],34:[3,1],35:[2,2],39:[3,1],44:[2,2],55:[3,2],59:[3,2],60:[2,2]};
function cutout(im){
 const {width:w,height:h,data:d}=im.bitmap,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const visit=p=>{if(seen[p])return;seen[p]=1;const o=p*4;if(d[o]>235&&d[o+1]>235&&d[o+2]>235){queue[tail++]=p;d[o+3]=0}};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x)}for(let y=1;y<h-1;y++){visit(y*w);visit(y*w+w-1)}
 while(head<tail){const p=queue[head++],x=p%w,y=(p/w)|0;if(x)visit(p-1);if(x<w-1)visit(p+1);if(y)visit(p-w);if(y<h-1)visit(p+w)}
 return im;
}
function trim(im){let left=im.bitmap.width,top=im.bitmap.height,right=0,bottom=0;im.scan((x,y,i)=>{if(im.bitmap.data[i+3]>20){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}});if(right>=left&&bottom>=top)im.crop({x:left,y:top,w:right-left+1,h:bottom-top+1});return im}
function cleanCell(im){
 const {width:w,height:h,data:d}=im.bitmap,seen=new Uint8Array(w*h),queue=new Int32Array(w*h),groups=[];
 for(let p=0;p<w*h;p++){if(seen[p]||d[p*4+3]<20)continue;let head=0,tail=1,edge=false;queue[0]=p;seen[p]=1;const pixels=[];while(head<tail){const a=queue[head++],x=a%w,y=(a/w)|0;pixels.push(a);if(!x||!y||x===w-1||y===h-1)edge=true;for(const n of [x?a-1:-1,x<w-1?a+1:-1,y?a-w:-1,y<h-1?a+w:-1]){if(n>=0&&!seen[n]&&d[n*4+3]>=20){seen[n]=1;queue[tail++]=n}}}groups.push({pixels,edge})}
 const largest=Math.max(0,...groups.map(g=>g.pixels.length));for(const g of groups)if(g.pixels.length<largest*.015||(g.edge&&g.pixels.length<largest*.3))for(const p of g.pixels)d[p*4+3]=0;
 return im;
}
(async()=>{
 for(const name of ['review','thumbs','motion'])fs.mkdirSync(path.join(root,name),{recursive:true});
 for(let i=0;i<entries.length;i++){
  const j=entries[i],file=path.join(root,j.month.toLowerCase(),j.id+'.png');if(!fs.existsSync(file))continue;
  const im=await Jimp.read(file);
  const flat=new Jimp({width:im.bitmap.width,height:im.bitmap.height,color:0xffffffff}).composite(im,0,0);
  await flat.clone().scaleToFit({w:1100,h:1100}).write(path.join(root,'review',j.id+'.jpg'),{quality:88});
  await flat.clone().scaleToFit({w:420,h:420}).write(path.join(root,'thumbs',j.id+'.jpg'),{quality:85});
  const cut=cutout(im.clone());
  if(Number.parseInt(j.id,10)>=66)trim(cut);
  await cut.clone().scaleToFit({w:640,h:640}).write(path.join(root,'motion',j.id+'.png'));
  if(sheets[i]){const [cols,rows]=sheets[i],h=Math.floor(cut.bitmap.height/rows);for(let k=0;k<cols*rows;k++){if(i===59&&k===5)continue;const row=Math.floor(k/cols),col=i===59&&row===1?k-3:k%cols,rowCols=i===59&&row===1?2:cols,w=Math.floor(cut.bitmap.width/rowCols);let cell=cut.clone().crop({x:col*w,y:row*h,w,h});if(i!==35)cell=cleanCell(cell);const part=trim(cell);await part.scaleToFit({w:240,h:240}).write(path.join(root,'motion',j.id+'-'+k+'.png'))}}
 }
 for(const id of ['beach-ball','wishbone','sleigh'])fs.copyFileSync(path.resolve(__dirname,'../items',id+'.webp'),path.join(root,'motion',id+'.webp'));
 console.log('Prepared review images, thumbnails and transparent animation derivatives.');
})().catch(e=>{console.error(e);process.exitCode=1});
