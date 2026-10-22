// Reuse the isolated browser runner with a separate page, storage key and test suite.
const fs=require('fs'),path=require('path');
let runner=fs.readFileSync(path.join(__dirname,'verify-sound-review-browser.cjs'),'utf8');
const start=runner.indexOf('const check=String.raw`'),end=runner.indexOf('\nserver.listen(',start);
runner=runner.slice(0,start)+"const check=fs.readFileSync(path.join(__dirname,'suspense-browser-check.js'),'utf8');"+runner.slice(end);
runner=runner.replaceAll("'sound-review-tests-'","'suspense-options-tests-'").replaceAll("'/anim/sound-review.html'","'/anim/sound-options.html?set=suspense'").replaceAll("removeItem('size-em-up-sound-audit-v2')","removeItem('size-em-up-suspense-options-v2')").replaceAll("'sound-review-'","'sound-suspense-'");
new Function('require','__dirname',runner)(require,__dirname);
