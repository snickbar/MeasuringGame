// Run existing full-game checks against packaged runtime files, not the source
// folder where a mistakenly omitted dependency could otherwise be hidden.
const fs=require('fs'),path=require('path');let runner=fs.readFileSync(path.join(__dirname,'verify-game-polish-browser.cjs'),'utf8');
runner=runner.replace("const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));","const file=path.resolve(root,'www','.'+decodeURIComponent(url.pathname));");
runner=runner.replaceAll("'polish-tests-'","'packed-game-tests-'");
new Function('require','__dirname',runner)(require,__dirname);
