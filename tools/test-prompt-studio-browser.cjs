const {chromium}=require('/home/pcos-axiom/Documents/pcos-agent/node_modules/playwright');
const assert=require('node:assert/strict');
const base=process.env.PROMPT_STUDIO_TEST_BASE||'http://127.0.0.1:8898';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1360,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/me',r=>r.fulfill({json:{ok:false,error:'auth_required'}}));
  await page.route('**/api/director/menu',r=>r.fulfill({json:{personas:{},shots:{storyboard:'Storyboard'},styles:['photoreal','noir-gothic','watercolor-storybook']}}));
  await page.route('**/api/video/compose',r=>r.fulfill({status:401,json:{ok:false,error:'auth_required'}}));
  await page.goto(base+'/prompt-studio.html');
  assert.equal(await page.locator('.card').count(),10);
  await page.getByRole('button',{name:'Influencer',exact:true}).click();assert.equal(await page.locator('.card').count(),3);
  await page.locator('.card').first().getByRole('button',{name:'Make it yours'}).click();
  await page.locator('#character').fill('<script>alert("x")</script> original Genie');
  await page.getByRole('button',{name:'Build my scene draft'}).click();assert.match(await page.locator('#output').inputValue(),/original Genie/);
  await page.getByRole('button',{name:'Refine with the AI Director'}).click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Sign in'));
  assert.match(await page.locator('#output').inputValue(),/original Genie/);
  await page.screenshot({path:'/home/pcos-axiom/Documents/GenieMade-Films-20261111/prompt-studio-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:'/home/pcos-axiom/Documents/GenieMade-Films-20261111/prompt-studio-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Plan a storyboard frame'}).click();await page.waitForURL('**/director');
  // Python's static test server needs the HTML extension; preserve sessionStorage on same origin.
  await page.goto(base+'/director.html');await page.waitForFunction(()=>document.querySelector('#scene').value.includes('original Genie'));
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('geniemade:starter-handoff')),null);
  assert.deepEqual(errors,[]);console.log('PASS browser: cards/filter/customization, escaped content, auth error preserves draft, mobile overflow, Director handoff. AI response mocked; not a live generation test.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
