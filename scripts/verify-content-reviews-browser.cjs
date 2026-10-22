const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-sound-review-browser.cjs'),'utf8');
const start=runner.indexOf('const check=String.raw`'),end=runner.indexOf('\nserver.listen(',start);
runner=runner.slice(0,start)+"const check=fs.readFileSync(path.join(__dirname,'content-review-browser-check.js'),'utf8');"+runner.slice(end);
runner=runner.replaceAll("'sound-review-tests-'","'content-review-tests-'").replaceAll("'/anim/sound-review.html'","'/anim/avatar-tier-review.html'").replaceAll("removeItem('size-em-up-sound-audit-v2')","removeItem('size-em-up-avatar-tiers-v1')").replaceAll("'sound-review-'","'avatar-tier-review-'");
new Function('require','__dirname',runner)(require,__dirname);
