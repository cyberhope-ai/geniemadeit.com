import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {starters,draftPrompt} from '../assets/film-starters.mjs';
assert.equal(new Set(starters.map(t=>t.id)).size,starters.length);
for(const t of starters){
 assert.ok(existsSync('.'+t.image),t.image);
 if(t.video)assert.ok(existsSync('.'+t.video),t.video);
 const f={...t,character:'Original test character',duration:10,aspect:'16:9',camera:'Locked camera',light:'Soft key light'};
 const p=draftPrompt(t,f);assert.ok(p.includes(t.idea));assert.ok(p.includes('not a submitted video job'));assert.ok(p.includes(t.dialogue));
 assert.throws(()=>draftPrompt(t,{...f,duration:120}));
}
const js=readFileSync('assets/prompt-studio.mjs','utf8');
assert.ok(!js.includes('innerHTML'));assert.ok(!js.includes('/api/generate'));assert.ok(!js.includes('/api/film/order'));assert.ok(js.includes('/api/video/compose'));
console.log(`PASS: ${starters.length} original starters, asset paths, prompt validation and no render submission.`);
