const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../art-source/monthly-unlocks-2026-11-04');
const entries = JSON.parse(fs.readFileSync(path.join(dir, 'prompts.json'), 'utf8').replace(/^\uFEFF/,''));
const jobs = entries.filter(j=>!j.supersededBy).map(j => ({...j, file: `${j.month.toLowerCase()}/${j.id}.png`})).filter(j => fs.existsSync(path.join(dir, j.file)));
for (const job of jobs) {
  const record = path.join(dir, job.file + '.json');
  if (fs.existsSync(record)) job.prompt = JSON.parse(fs.readFileSync(record, 'utf8')).prompt;
  if(fs.existsSync(path.join(dir, 'review', job.id+'.jpg'))){job.file='review/'+job.id+'.jpg';job.thumb='thumbs/'+job.id+'.jpg';}
}
const css=fs.readFileSync(path.join(__dirname,'monthly-unlock-motion.css'),'utf8')+fs.readFileSync(path.join(__dirname,'monthly-reaction-fixes.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'monthly-unlock-motion.js'),'utf8');
const template = fs.readFileSync(path.join(__dirname, 'monthly-unlock-gallery.html'), 'utf8')
 .replace('</style>',css+'\n</style>')
 .replace('<script>','<script>'+js+'\n</script><script>')
 .replace('<div class="grid">${group.map','${monthlyMotion(m,jobs)}<div class="grid">${group.map')
 .replace("join('')||'<p class=\"empty\">No artwork in this view.</p>';updateProgress();", "join('')||'<p class=\"empty\">No artwork in this view.</p>';updateProgress();attachMonthlyMotion(jobs);");
fs.writeFileSync(path.join(dir, 'gallery.html'), template.replace('/* MONTHLY_DATA */ []', JSON.stringify(jobs).replaceAll('<', '\\u003c')));
console.log(`Gallery: ${jobs.length}/${entries.length} assets available`);
