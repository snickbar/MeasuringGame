import { createStackAnimation } from './stack-anim.js';
import { SCENERY_BY_OBJECT } from './scenery.mjs';

const $ = id => document.getElementById(id);
const storageKey = 'size-em-up-scenery-draft-v1';
const pageSize = 40;
let data, draft = {}, page = 0, previewControl, previewScene, preparing = false;
const sceneName = id => data.scenes.find(s => s.id === id)?.name || id;
const chosen = o => draft[o.id] || o.current;
const changedCount = () => Object.keys(draft).length;
const status = text => { $('save-status').textContent = text; };

function validatePicks(input) {
  if (input?.type !== 'size-em-up-scenery-picks' || input.version !== 1 || !Array.isArray(input.objects)) throw Error('Choose a scenery-choices export from this page.');
  const known = new Map(data.objects.map(o => [o.id,o])), scenes = new Set(data.scenes.map(s => s.id));
  const result = {}, seen = new Set();
  for (const pick of input.objects) {
    const object = known.get(pick.id);
    if (!object || !scenes.has(pick.scenery) || seen.has(pick.id)) throw Error('The file contains an unknown or repeated object or scenery.');
    seen.add(pick.id);
    if (pick.scenery !== object.current) result[pick.id] = pick.scenery;
  }
  return result;
}
function exportData() {
  return { type:'size-em-up-scenery-picks', version:1, exportedAt:new Date().toISOString(),
    objects:data.objects.map(o => ({id:o.id,name:o.name,currentScenery:o.current,scenery:chosen(o)})) };
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(exportData())); status(`${changedCount()} changed · draft saved on this browser. Export when you’re ready.`); }
  catch { status(`${changedCount()} changed · browser storage unavailable. Export to save your choices.`); }
}
function filtered() {
  const query = $('search').value.toLowerCase().trim();
  return data.objects.filter(o => (!query || `${o.name} ${o.id} ${o.pack}`.toLowerCase().includes(query))
    && (!$('group').value || o.group === $('group').value)
    && (!$('scene-filter').value || o.current === $('scene-filter').value)
    && (!$('fallback').checked || !o.explicit)
    && (!$('changed').checked || draft[o.id]));
}
function render() {
  const objects = filtered(), pages = Math.max(1,Math.ceil(objects.length/pageSize));
  page = Math.max(0,Math.min(page,pages-1));
  $('list').replaceChildren();
  $('count').textContent = `${objects.length} of ${data.objects.length} objects · ${changedCount()} changed · ${data.objects.filter(o=>!o.explicit).length} use the grass fallback`;
  for (const o of objects.slice(page*pageSize,(page+1)*pageSize)) {
    const card = document.createElement('article'); card.className = 'object' + (draft[o.id] ? ' changed' : ''); card.dataset.id = o.id;
    const image = new Image(); image.src = '../' + o.image; image.alt = ''; image.loading = 'lazy'; image.onerror = () => { image.hidden = true; };
    const info = document.createElement('div'), title = document.createElement('h2'), category = document.createElement('p'), current = document.createElement('p');
    title.textContent = o.name; category.textContent = o.group + (o.pack ? ' · ' + o.pack : '');
    current.textContent = 'Current: ' + sceneName(o.current) + ' ';
    if (!o.explicit) { const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = 'Grass fallback'; current.append(tag); }
    info.append(title,category,current);
    const controls = document.createElement('div'); controls.className = 'choice';
    const select = document.createElement('select'); select.setAttribute('aria-label','Scenery for '+o.name);
    for (const scene of data.scenes) select.add(new Option(scene.name,scene.id)); select.value = chosen(o);
    select.onchange = () => { if (select.value === o.current) delete draft[o.id]; else draft[o.id] = select.value; persist(); render(); };
    const button = document.createElement('button'); button.textContent = 'Preview'; button.onclick = () => preview(o);
    controls.append(select,button); card.append(image,info,controls); $('list').append(card);
  }
  if (!objects.length) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'No objects match these filters.'; $('list').append(empty); }
  $('page').textContent = `${page+1} / ${pages}`; $('prev').disabled = page === 0; $('next').disabled = page === pages-1;
}
async function preview(object) {
  if (preparing) return;
  preparing = true; previewControl?.destroy(); previewScene = null;
  const scene = chosen(object); $('preview-title').textContent = object.name;
  $('preview-caption').textContent = `${sceneName(scene)} · ${draft[object.id] ? 'Your draft choice' : 'Current setting'}`;
  $('preview-status').textContent = 'Loading scenery…'; $('play').disabled = $('still').disabled = true;
  if (!$('preview').open) $('preview').showModal();
  // This module instance belongs only to the review page. Restore it after
  // prepare; the prepared scene retains its selected scenery kit.
  const old = SCENERY_BY_OBJECT[object.id]; SCENERY_BY_OBJECT[object.id] = scene;
  try {
    previewControl = createStackAnimation($('stage'), { imageUrl:o=>'../'+o.image });
    const target = {...object}, unit = data.objects.find(o => o.mm < object.mm) || {...object,mm:object.mm/5};
    previewScene = await previewControl.prepare(unit,target,{hMax:230,minStageH:280});
    if (!$('preview').open) { previewControl.destroy(); return; }
    previewScene.renderEnd(); $('preview-status').textContent = 'Ready. Play to see the scenery move with the stack.';
    $('play').disabled = $('still').disabled = false;
  } catch (error) { $('preview-status').textContent = 'Preview could not load: '+error.message; }
  finally { if (old === undefined) delete SCENERY_BY_OBJECT[object.id]; else SCENERY_BY_OBJECT[object.id] = old; preparing = false; }
}
$('close').onclick = () => $('preview').close();
$('preview').addEventListener('close',()=>previewControl?.stop());
$('play').onclick = () => { if(previewScene) previewControl.start(previewScene); };
$('still').onclick = () => { previewControl?.stop(); previewScene?.renderEnd(); };
$('export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download='size-em-up-scenery-picks.json'; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000); status(`${changedCount()} changes exported. Send me the JSON file to apply them.`);
};
$('import').onclick = () => $('file').click();
$('file').onchange = async () => {
  try { const text = await $('file').files[0]?.text(); if (!text) return; const picks = validatePicks(JSON.parse(text)); draft=picks; persist(); render(); }
  catch (error) { status('Import failed: '+error.message); }
  finally { $('file').value=''; }
};
$('reset').onclick = () => { if (!changedCount()) return; if (confirm('Reset your draft choices to the current game settings?')) { draft={}; persist(); render(); } };
for (const id of ['search','group','scene-filter','fallback','changed']) $(id).addEventListener(id==='search'?'input':'change',()=>{page=0;render();});
$('prev').onclick=()=>{page--;render();}; $('next').onclick=()=>{page++;render();};
try {
  const response=await fetch('./scenery-object-data.json',{cache:'no-store'}); if(!response.ok)throw Error('Object list could not load.'); data=await response.json();
  for(const s of data.scenes) $('scene-filter').add(new Option(s.name,s.id));
  try { const saved=localStorage.getItem(storageKey); if(saved)draft=validatePicks(JSON.parse(saved)); }
  catch { status('Saved draft could not be restored. You can import your last export.'); }
  for(const id of ['export','import','reset'])$(id).disabled=false;
  render(); if(!$('save-status').textContent.startsWith('Saved draft')) status(`${changedCount()} changed · your draft saves in this browser. Export to share your choices.`);
  window.__sceneryReview = { data, exportData, validatePicks, getDraft:()=>({...draft}) }; window.__sceneryReviewReady=true;
} catch(error) { status('Could not open the review: '+error.message+' Open this page through the local preview server.'); }
