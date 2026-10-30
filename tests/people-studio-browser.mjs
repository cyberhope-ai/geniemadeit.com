// Local, mocked API checks: no account, upload storage, payment or image generation calls.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined, headless: true, args: ['--no-sandbox'] });
const person = { id:'friend', name:'Christy', relationship:'sibling', photo_permission:true, photos:['/asset/uploads/user/a.jpg','/asset/uploads/user/b.jpg'], occasions:[] };
let saved, used=0, currentPerson=person;
try {
  const page = await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*', async route => {
    const url=new URL(route.request().url());let body;
    if(url.pathname==='/people')return route.fulfill({contentType:'text/html',body:readFileSync(new URL('../people/index.html',import.meta.url),'utf8')});
    if(url.pathname==='/studio-create')return route.fulfill({contentType:'text/html',body:readFileSync(new URL('../studio-create.html',import.meta.url),'utf8')});
    if(url.pathname==='/api/auth/me')body={authenticated:true,user:{email:'test@example.invalid'}};
    else if(url.pathname==='/api/people'){
      if(route.request().method()==='POST'){saved=route.request().postDataJSON();currentPerson={...currentPerson,...saved};body={ok:true,people:[currentPerson]};}
      else body={ok:true,people:[currentPerson]};
    }else if(url.pathname==='/api/reminders')body={reminders:[]};
    else if(url.pathname==='/api/studio/session')body={session:{looks_total:6,looks_used:used},model:{job:{notified:true,total:6,done:6}},config:{min_photos:2,max_photos:25}};
    else if(url.pathname==='/api/studio/looks')body={looks:[]};
    else if(url.pathname.startsWith('/api/'))body={ok:true};
    else return route.fulfill({status:200,body:''});
    return route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto('https://geniemadeit.com/people');
  await page.locator('.pc').click();
  await page.locator('#fPhz .cover').nth(1).click();
  assert.equal(await page.locator('#fPhz .cover').nth(1).getAttribute('aria-pressed'),'true');
  await page.locator('#fRel').selectOption('sister-in-law');
  await page.locator('#addOccasion').click();
  await page.getByLabel('Occasion name',{exact:true}).fill('Work anniversary');
  await page.getByLabel('Occasion date',{exact:true}).fill('2020-02-20');
  await page.locator('#mSave').click();
  await page.locator('#ov').waitFor({state:'hidden'});
  assert.equal(saved.occasions[0].label,'Work anniversary');
  assert.equal(saved.photo_permission,true);
  assert.equal(saved.cover_photo,person.photos[1]);
  assert.equal(saved.relationship,'sister-in-law');
  await page.reload();
  await page.locator('.pc').waitFor();
  assert.equal(await page.locator('.pc .ph img').getAttribute('src'),person.photos[1]);
  await page.locator('.pc').click();
  await page.locator('#fPhz .x').nth(1).click();
  assert.equal(await page.locator('#fPhz .cover').first().getAttribute('aria-pressed'),'true');
  await page.locator('#mCancel').click();
  await page.goto('https://geniemadeit.com/studio-create');
  await page.locator('#newStudio').click();
  await page.locator('#stepUpload').waitFor({state:'visible'});
  await page.goto('https://geniemadeit.com/studio-create?person=friend');
  await page.locator('#savedLibrary').waitFor();
  assert.equal(await page.locator('#savedLibrary img').count(),2);
  assert.equal(await page.locator('#uploadBtn').isDisabled(),true);
  for(const checkbox of await page.locator('#savedLibrary input').all())await checkbox.check();
  assert.equal(await page.locator('#uploadBtn').isEnabled(),true);
  await page.locator('#ageInput').fill('40');
  await page.locator('#uploadBtn').click();
  await page.locator('#stepLooks').waitFor({state:'visible'});
  used=6;
  await page.goto('https://geniemadeit.com/studio-create');
  await page.locator('#newStudio').click();
  await page.locator('#gate').waitFor({state:'visible'});
  assert.match(await page.locator('#gateTitle').textContent(),/new Studio package/);
  assert.deepEqual(errors,[]);
  console.log('PASS: cover selection/save/reload/removal fallback, relationship save, occasion save, completed-session restart, person reference selection, exhausted-package gate; zero browser errors.');
} finally { await browser.close(); }
