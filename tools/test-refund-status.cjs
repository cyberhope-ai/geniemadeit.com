const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
(async()=>{
 const studio=readFileSync('assets/studio.js','utf8');
 const director=readFileSync('assets/director.js','utf8');
 for(const status of ['refunding','refund_review']){
  const c=vm.createContext({Date,setTimeout:f=>f(),fetch:async()=>({json:async()=>({status,credits_remaining:20,error:'Refund needs verification'})})});
  vm.runInContext(studio.slice(studio.indexOf('  async function pollJob('),studio.indexOf('  // ---- create flow')),c);
  const result=await c.pollJob('/api/jobs/test',()=>assert.fail('must stop rendering'));
  assert.equal(result.ok,false);assert.equal(result.error,'refund_review');assert.equal(result.credits_remaining,20);
  let message;
  const d=vm.createContext({Date,setTimeout:f=>f(),api:async()=>({status,error:'Refund needs verification'}),say:m=>message=m});
  vm.runInContext(director.slice(director.indexOf('  async function pollJob('),director.indexOf('  async function landed(')),d);
  await d.pollJob('test');assert.equal(message,'Refund needs verification');
 }
 console.log('PASS: Studio and Director stop on refund verification without claiming a completed refund.');
})().catch(e=>{console.error(e);process.exitCode=1;});
