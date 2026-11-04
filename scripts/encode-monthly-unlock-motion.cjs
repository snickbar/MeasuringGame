const fs=require('node:fs'),path=require('node:path'),{runFixture}=require('./browser-fixture.cjs');
const root='art-source/monthly-unlocks-2026-11-04/motion';
const files=fs.readdirSync(root).filter(file=>file.endsWith('.png'));
(async()=>{await runFixture({html:'<!doctype html><title>Encode prepared artwork</title>',widths:[400],out:'output/monthly-unlock-encoding',check:async({evaluate})=>{
 for(const file of files){const url='/'+root+'/'+file;
 const encoded=await evaluate(`(async()=>{const im=new Image();im.src=${JSON.stringify(url)};await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);const data=c.toDataURL('image/webp',.91);if(!data.startsWith('data:image/webp;'))throw Error('WebP encoding unavailable');return data.split(',')[1]})()`);
 const dest=path.join(root,file.replace(/\.png$/,'.webp'));fs.writeFileSync(dest,Buffer.from(encoded,'base64'));
 // These PNGs are reproducible intermediates. Original month PNGs are preserved.
 fs.unlinkSync(path.join(root,file));
 }
 }});console.log('Encoded '+files.length+' animation assets as WebP.');})().catch(e=>{console.error(e);process.exitCode=1});
