// Mocked APIs only: no messages, publication changes, customer data or credits.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox']});
let sends=0,saves=0,publishes=0,opted=false,cooldown=false,auto=false;
try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const p=new URL(route.request().url()).pathname;let body={ok:true};
    if(p==='/account')return route.fulfill({contentType:'text/html',body:readFileSync(new URL('../account.html',import.meta.url),'utf8')});
    if(p==='/assets/sms-consent.js')return route.fulfill({contentType:'application/javascript',body:readFileSync(new URL('../assets/sms-consent.js',import.meta.url),'utf8')});
    if(!p.startsWith('/api/'))return route.fulfill({body:''});
    if(p==='/api/auth/me')body={user:{email:'test@example.invalid'}};
    if(p==='/api/sms/config')body={ok:true,opt_in_enabled:true,sending_enabled:true,disclosure_version:'test',disclosure_text:'Optional text consent'};
    if(p==='/api/account/sms'){
      if(route.request().method()==='PUT'){saves++;const b=route.request().postDataJSON();assert.equal(b.sms_consent.accepted,true);assert.equal(b.sms_consent.terms_accepted,true);opted=true;}
      body={ok:true,opted_in:opted,phone_ending:opted?'0100':null,sending_enabled:true,can_test:opted&&!cooldown,last_test_status:cooldown?'accepted':null,retry_at:cooldown?new Date(Date.now()+600000).toISOString():null};
    }
    if(p==='/api/account/test-sms'){sends++;cooldown=true;body={ok:true,status:'accepted'};}
    if(p==='/api/settings/auto-publish'){if(route.request().method()==='POST'){publishes++;auto=route.request().postDataJSON().enabled;}body={ok:true,auto_publish:auto};}
    return route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto('https://geniemadeit.com/account');
  await page.getByText('No text permission saved.',{exact:false}).waitFor();
  assert.equal(await page.locator('#accountTestSms').isDisabled(),true);assert.equal(sends,0);assert.equal(publishes,0);
  await page.locator('summary').click();await page.locator('#accountSmsPhone').fill('3175550100');
  await page.locator('#saveSmsNumber').click();assert.equal(saves,0);
  await page.locator('#accountSmsAccepted').check();await page.locator('#accountSmsTerms').check();await page.locator('#saveSmsNumber').click();
  await page.getByText('Text permission saved.',{exact:false}).waitFor();assert.equal(sends,0);
  page.on('dialog',d=>d.accept());await page.locator('#accountTestSms').click();
  await page.getByText('Test accepted by the text provider.',{exact:false}).waitFor();assert.equal(sends,1);
  await page.reload();await page.getByText('Next account test available',{exact:false}).waitFor();assert.equal(await page.locator('#accountTestSms').isDisabled(),true);
  await page.locator('#autoPublish').check();await page.locator('#saveSharing').click();
  await page.getByText('Future creations are set to publish publicly.',{exact:true}).waitFor();assert.equal(publishes,1);
  assert.deepEqual(errors,[]);console.log('PASS: Account consent, test confirmation, cooldown reload, explicit public sharing; no browser errors.');
}finally{await browser.close();}
