// All routes mocked. No real generation, uploads, imports or credit changes.
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox']});
const root=new URL('../',import.meta.url), wishes=[],imports=[],uploads=[];
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aSFEAAAAASUVORK5CYII=','base64');
const person={id:'mark',name:'Mark',photo_permission:true,photos:Array.from({length:7},(_,i)=>'/asset/uploads/user/mark'+i+'.jpg')};
const generation={id:'gen',url:'/asset/gen/user/result.png',model:'test-model',certificate:{receipt_id:'receipt',hash:'1234567890',issued_at:'2026-10-31'}};
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('gm_user','test@example.invalid');localStorage.setItem('gm_credits','100');localStorage.setItem('gm_welcomed','1');localStorage.setItem('gm_first_wish_done','1');});
  await page.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());let body={ok:true};
    if(u.origin!=='https://geniemadeit.com')return route.fulfill({body:''});
    if(u.pathname.startsWith('/asset/'))return route.fulfill({contentType:'image/png',body:pixel});
    if(u.pathname.startsWith('/api/')){
      if(u.pathname==='/api/auth/me')body={authenticated:true,user:{email:'test@example.invalid',credits:100,plan:'free'}};
      if(u.pathname==='/api/capabilities')body={capabilities:[{items:[{id:'image.text',name:'Image',status:'live',credits:2},{id:'image.pro',name:'Pro Image',status:'live',credits:6},{id:'image.ultra',name:'Ultra Realism',status:'live',credits:20},{id:'video.image2video',name:'Animate Photo',status:'live',credits:40}]}]};
      if(u.pathname==='/api/people')body={ok:true,people:[person,{id:'blocked',name:'Permission missing',photos:person.photos}]};
      if(u.pathname==='/api/gallery')body={ok:true,generations:[{id:'vault',url:'/asset/gen/user/a.png',prompt:'Vault portrait',capability:'image.pro'},{id:'video',url:'/asset/gen/user/a.mp4',capability:'video.image2video'}]};
      if(u.pathname==='/api/registry/mine')body={ok:true,registrations:[{receipt_id:'mine',title:'My registry portrait',thumb_url:'/asset/reg/mine.jpg'},{receipt_id:'empty',title:'No image'}]};
      if(u.pathname==='/api/people/public-registry')body=u.searchParams.has('anchor')?{ok:true,owner:'Pierce',registrations:[{receipt_id:'pub',title:'Public pirate',thumb_url:'/asset/reg/pub.png'}]}:{ok:true,owners:[{owner:'Pierce',anchor:'receipt-a'},{owner:'Pierce',anchor:'receipt-b'}]};
      if(u.pathname==='/api/people/import-vault'){const b=req.postDataJSON();imports.push(b);body={ok:true,url:'/asset/uploads/user/'+b.source+'.png'};}
      if(u.pathname==='/api/upload'){uploads.push(req.postDataBuffer());body={ok:true,url:'/asset/uploads/user/upload'+uploads.length+'.png'};}
      if(u.pathname==='/api/generate'){const b=req.postDataJSON();wishes.push(b);body=b.capability==='image.ultra'?{ok:true,status:'processing',poll_url:'/api/jobs/mock',credits_remaining:80}:{ok:true,generation,credits_remaining:94};}
      if(u.pathname==='/api/jobs/mock')body={ok:true,status:'completed',generation,credits_remaining:80};
      return route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
    }
    const name=u.pathname==='/app'?'app.html':u.pathname.slice(1),file=new URL(name,root);
    if(!existsSync(file))return route.fulfill({status:404,body:''});
    const contentType=name.endsWith('.html')?'text/html':name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'application/octet-stream';
    return route.fulfill({contentType,body:readFileSync(file)});
  });
  // The default Image option really permits only one; explain the choice rather than dropping photos.
  await page.goto('https://geniemadeit.com/app');
  await page.locator('[data-cap="image.text"][aria-pressed=true]').waitFor();
  await page.locator('#refBtn').click();await page.getByRole('button',{name:'My People / contacts',exact:true}).click();
  await page.locator('#wishPerson').selectOption('mark');
  assert.match(await page.locator('#wishLimit').innerText(),/up to 1 reference/);
  assert.match(await page.locator('#wishLimit').innerText(),/choose Pro Image, Realistic Portrait or Ultra Realism/);
  await page.locator('#wishSelectAll').click();
  assert.equal(await page.locator('#wishLibrary input:checked').count(),1);
  await page.locator('#wishClearSelection').click();
  assert.equal(await page.locator('#wishLibrary input:checked').count(),0);
  await page.locator('#wishClose').click();
  assert.equal(wishes.length,0);
  await page.locator('[data-cap="image.ultra"]').click();
  await page.locator('[data-cap="image.ultra"][aria-pressed=true]').waitFor();
  assert.match(await page.locator('#wishQuality').innerText(),/20 credits/);
  await page.locator('#refBtn').click();await page.getByRole('button',{name:'My People / contacts',exact:true}).click();
  await page.locator('#wishPerson option[value=mark]').waitFor({state:'attached'});
  assert.equal(await page.locator('#wishPerson option[value=blocked]').evaluate(el=>el.disabled),true);
  await page.locator('#wishPerson').selectOption('mark');
  assert.equal(await page.locator('#wishLibrary input').count(),7);
  await page.locator('#wishFilter').fill('photo 7');await page.locator('#wishSelectAll').click();
  assert.equal(await page.locator('#wishLibrary input:checked').count(),1);
  assert.equal(await page.locator('#wishLibrary input').nth(6).isChecked(),true);
  await page.locator('#wishClearSelection').click();await page.locator('#wishFilter').fill('');
  await page.locator('#wishSelectAll').click();
  assert.equal(await page.locator('#wishLibrary input:checked').count(),5);
  assert.equal(await page.locator('#wishAdd').innerText(),'Add 5 selected photos');
  await page.locator('#wishLibrary input').nth(5).click();assert.equal(await page.locator('#wishLibrary input').nth(5).isChecked(),false);
  await page.locator('#wishAdd').click();assert.equal(await page.locator('#wishReferences figure').count(),0);
  await page.locator('#wishPermission').check();await page.locator('#wishAdd').click();
  assert.equal(await page.locator('#wishReferences figure').count(),5);
  assert.equal(await page.locator('#wishSelectAll').isDisabled(),true);
  assert.equal(await page.locator('#wishLibrary input:disabled').count(),5);
  assert.match(await page.locator('#wishSelectionCount').innerText(),/5\/5 already added/);
  await page.locator('#wishClose').click();
  await page.locator('#prompt').fill('Cheeto Uncle Mark: use references 1–5 for Mark’s face. A realistic orange cheese puff with arms and legs, playful family birthday scene.');
  await page.locator('[data-cap="video.image2video"]').click();await page.locator('#makeBtn').click();assert.equal(wishes.length,0);
  assert.match(await page.locator('#refHint').innerText(),/Remove extra/);
  await page.locator('[data-cap="image.ultra"]').click();await page.locator('#makeBtn').click();
  await page.locator('#result.on').waitFor();assert.equal(wishes[0].image_urls.length,5);assert.deepEqual(wishes[0].image_urls,person.photos.slice(0,5));
  await page.locator('#refBtn').scrollIntoViewIfNeeded();
  await page.screenshot({path:'/tmp/geniemade-wish-ultra-desktop.png',fullPage:true});
  for(let i=0;i<5;i++)await page.locator('#wishReferences button').first().click();
  await page.locator('#refBtn').click();await page.getByRole('button',{name:'My Vault',exact:true}).click();await page.locator('#wishLibrary input').first().waitFor();
  assert.equal(await page.locator('#wishLibrary input').count(),1);
  await page.locator('#wishPermission').check();await page.locator('#wishLibrary input').first().check();await page.locator('#wishAdd').click();
  await page.waitForFunction(()=>document.querySelectorAll('#wishReferences figure').length===1);assert.equal(imports[0].source,'vault');
  await page.getByRole('button',{name:'EverVerify',exact:true}).click();await page.locator('#wishLibrary input').first().waitFor();assert.equal(await page.locator('#wishLibrary input').count(),1);
  await page.locator('#wishPermission').check();await page.locator('#wishLibrary input').first().check();await page.locator('#wishAdd').click();
  await page.waitForFunction(()=>document.querySelectorAll('#wishReferences figure').length===2);assert.equal(imports[1].source,'eververify');
  await page.locator('#wishOwner').fill('Pierce');await page.locator('#wishSearch').click();await page.locator('#wishOwners button').first().waitFor();assert.equal(await page.locator('#wishOwners button').count(),2);
  await page.locator('#wishOwners button').first().click();await page.getByText('Public pirate',{exact:true}).waitFor();
  assert.equal(await page.locator('#wishPermission').isChecked(),false);await page.locator('#wishPermission').check();await page.locator('#wishLibrary input').first().check();await page.locator('#wishAdd').click();
  await page.waitForFunction(()=>document.querySelectorAll('#wishReferences figure').length===3);assert.equal(imports[2].source,'public-eververify');assert.equal(imports[2].owner_anchor,'receipt-a');
  await page.getByRole('button',{name:'From my device',exact:true}).click();await page.locator('#wishPermission').check();
  await page.locator('#wishFiles').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:pixel},{name:'two.png',mimeType:'image/png',buffer:pixel}]);
  await page.waitForFunction(()=>document.querySelectorAll('#wishReferences figure').length===5);assert.equal(uploads.length,2);
  await page.locator('#wishClose').click();await page.locator('[data-cap="image.pro"]').click();await page.locator('#makeBtn').click();
  await page.locator('#result.on').waitFor();assert.equal(wishes[1].capability,'image.pro');assert.equal(wishes[1].image_urls.length,5);
  await page.setViewportSize({width:390,height:844});await page.locator('#refBtn').click();await page.getByRole('button',{name:'My People / contacts',exact:true}).click();await page.locator('#wishPerson').selectOption('mark');
  await page.screenshot({path:'/tmp/geniemade-wish-picker-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: 4 sources, owner distinction, permission, five refs, six rejected, order, video guard, Ultra progress, Pro request, desktop/mobile. All APIs mocked.');
}finally{await browser.close();}
