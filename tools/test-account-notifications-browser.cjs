const {chromium}=require('/home/pcos-axiom/Documents/pcos-agent/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  let enabled=true,fail=false,saved;
  const prefs={email_generation_complete:false,email_billing:true,email_marketing:false,email_product_updates:true};
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==='/api/auth/me')return route.fulfill({json:{user:{id:'test'}}});
   if(path==='/api/settings/notifications'){
    if(route.request().method()==='PUT'){saved=route.request().postDataJSON();Object.assign(prefs,saved);}
    return route.fulfill({json:{notifications:prefs}});
   }
   if(path==='/api/notifications')return route.fulfill(fail?{status:503,json:{error:'unavailable'}}:{json:{enabled,notifications:[
     {channel:'email',status:'accepted',updated_at:Date.now()},
     {channel:'sms',status:'delivered',updated_at:Date.now()},
     {channel:'email',status:'uncertain',updated_at:Date.now()},
     {channel:'sms',status:'<img src=x onerror=alert(1)>',updated_at:'bad'}]}});
   return route.fulfill({json:{ok:true,account:{},credits:{},address:{},invoices:[],generations:[],items:[]}});
  });
  await page.goto('http://127.0.0.1:8898/account.html');
  await page.waitForFunction(()=>!document.querySelector('#generationEmail').disabled);
  await page.locator('#generationEmail').check();await page.locator('#saveGenerationEmail').click();
  await page.waitForFunction(()=>document.querySelector('#generationEmailStatus').textContent.includes('saved'));
  assert.equal(saved.email_generation_complete,true);assert.equal(saved.email_billing,true);assert.equal(saved.email_marketing,false);
  assert.match(await page.locator('#notificationHistory').textContent(),/Accepted by provider/);
  assert.match(await page.locator('#notificationHistory').textContent(),/Delivery confirmed/);
  assert.match(await page.locator('#notificationHistory').textContent(),/review needed/);
  assert.equal(await page.locator('#notificationHistory img').count(),0);
  enabled=false;await page.locator('#refreshNotifications').click();
  await page.waitForFunction(()=>document.querySelector('#notificationStatus').textContent.includes('not enabled'));
  assert.equal(await page.locator('#notificationHistory li').count(),0);
  fail=true;await page.locator('#refreshNotifications').click();
  await page.waitForFunction(()=>document.querySelector('#notificationStatus').textContent.includes('try again'));
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  console.log('PASS account notifications: preference preservation, truthful delivery labels, safe unknown status, disabled/error states, mobile width. API mocked; not live delivery proof.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
