import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../_worker.js',import.meta.url),'utf8').replace('export default','globalThis.worker =');
function setup(upstream){
  const calls=[];
  const c=vm.createContext({URL,Request,Response,Headers,
    caches:{default:{match(){throw Error('stale cache consulted');},put(){throw Error('private media cached');}}},
    fetch:async req=>{calls.push(req);return upstream(req);}
  });
  vm.runInContext(source,c);
  return {worker:c.worker,calls};
}
test('GET, HEAD and range media checks always reach engine with credentials intact',async()=>{
  for(const method of ['GET','HEAD']){
    const {worker,calls}=setup(()=>new Response(method==='HEAD'?null:'bytes',{status:206,headers:{'content-range':'bytes 0-4/20','cache-control':'public, max-age=31536000'}}));
    const r=await worker.fetch(new Request('https://geniemadeit.com/asset/gen/owner/movie.mp4?download=1',{
      method,headers:{cookie:'gm_session=test-only',authorization:'Bearer test-only',range:'bytes=0-4'}
    }),{},{});
    assert.equal(calls.length,1);assert.equal(calls[0].method,method);
    assert.equal(new URL(calls[0].url).hostname,'geniemade-engine.cyberhopeai.workers.dev');
    assert.equal(new URL(calls[0].url).search,'?download=1');
    for(const [key,value] of [['cookie','gm_session=test-only'],['authorization','Bearer test-only'],['range','bytes=0-4']])assert.equal(calls[0].headers.get(key),value);
    assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 0-4/20');
    assert.equal(r.headers.get('cache-control'),'private, no-store');
    assert.equal(r.headers.get('cloudflare-cdn-cache-control'),'no-store');
  }
});
test('revoked asset and hidden manifest cannot be served from old cache',async()=>{
  for(const path of ['/asset/gen/owner/deleted.mp4','/asset/packs/manifest.json','/asset/uploads/owner/private.jpg']){
    const {worker,calls}=setup(()=>new Response('not found',{status:404}));
    const r=await worker.fetch(new Request('https://geniemadeit.com'+path),{},{});
    assert.equal(r.status,404);assert.equal(calls.length,1);assert.match(r.headers.get('cache-control'),/no-store/);
  }
});
