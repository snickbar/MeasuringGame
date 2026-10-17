import fs from 'node:fs';
import vm from 'node:vm';
import { sceneryFor, SCENERY_BY_OBJECT, SETTINGS } from '../anim/scenery.mjs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const source = name => {
  const match = html.match(new RegExp('const ' + name + ' = (\\[[\\s\\S]*?\\n  \\]);'));
  if (!match) throw Error('Missing object list: ' + name);
  return match[1];
};
const read = name => vm.runInNewContext('(' + source(name) + ')', {}, { timeout: 1000 });
const objects = [
  ...read('OBJECTS').map(o => ({ ...o, group: 'Standard', image: o.image || `items/${o.id}.webp` })),
  ...read('HOLIDAY_OBJECT_DEFS').map(d => ({ id:d[1], name:d[2], plural:d[3], mm:d[4], group:'Seasonal', pack:d[0], image:`items/${d[1]}.webp` })),
  ...read('FANTASY_OBJECT_DEFS').map(d => ({ id:d[0], name:d[1], plural:d[2], mm:d[3], group:'Fantasy', image:`items/${d[0]}.webp` }))
].map(o => ({ id:o.id, name:o.name, plural:o.plural, mm:o.mm, image:o.image, group:o.group, pack:o.pack || '',
  current:sceneryFor(o), explicit:!!SCENERY_BY_OBJECT[o.id], imageAvailable:fs.existsSync(new URL(o.image, root))
})).sort((a,b) => a.name.localeCompare(b.name));
if (new Set(objects.map(o => o.id)).size !== objects.length) throw Error('Duplicate object IDs');
const names = { grass:'Grass', beach:'Sunset beach', living:'Living room', kitchen:'Kitchen', tabletop:'Tabletop', city:'Night city', forest:'Forest', farm:'Farm', snow:'Snow', desert:'Desert', underwater:'Underwater', space:'Space', enchanted:'Enchanted meadow' };
const data = { version:1, scenes:Object.keys(SETTINGS).map(id => ({id, name:names[id]})), objects };
fs.writeFileSync(new URL('anim/scenery-object-data.json', root), JSON.stringify(data,null,2)+'\n');
console.log(`${objects.length} objects; ${objects.filter(o=>!o.explicit).length} currently fall back to grass. Flying saucer: ${sceneryFor({id:'flying-saucer'})}.`);
