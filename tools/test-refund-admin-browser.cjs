const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const page=await browser.newPage({viewport:{width,height:900}});let mode='cases',calls=0;
   await page.route('https://test.invalid/**',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/admin.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(__dirname,'../admin.html'),'utf8')});
    if(url.pathname==='/gmadmin/refund-reviews'){
     calls++;assert.equal(route.request().headers()['x-admin-token'],'test-only');assert.equal(url.searchParams.has('token'),false);
     if(mode==='error')return route.fulfill({status:503,json:{}});
     return route.fulfill({json:{ok:true,total:mode==='empty'?0:1,reviews:mode==='empty'?[]:[{id:'<img src=x onerror=alert(1)>',user_id:'owner',status:'refund_review',cost:40,age_seconds:600,needs_attention:true}]}});
    }
    return route.fulfill({json:{ok:true,affiliates:[]}});
   });
   await page.addInitScript(()=>sessionStorage.setItem('gm_admin_token','test-only'));
   await page.goto('https://test.invalid/admin.html');
   await page.locator('[data-tab=refunds]').click();
   await page.waitForFunction(()=>document.querySelector('#refundCases article'));
   assert.match(await page.locator('#refundCases').innerText(),/Needs attention/);
   assert.equal(await page.locator('#refundCases img').count(),0);
   mode='error';await page.locator('#refreshBtn').click();
   await page.waitForFunction(()=>document.querySelector('#refundNote').textContent.includes('Status is unknown'));
   assert.equal(await page.locator('#refundCases article').count(),0);
   mode='empty';await page.locator('#refreshBtn').click();
   await page.waitForFunction(()=>document.querySelector('#refundNote').textContent.includes('No refunds'));
   assert.equal(calls,3);await page.close();
  }
  console.log('PASS: desktop/mobile refund admin, safe text, header auth, failures and empty state');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
