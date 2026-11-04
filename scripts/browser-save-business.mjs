import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1600,height:900},offline:true});const page=await context.newPage();const errors=[],network=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
const open=async()=>{await page.goto('file://'+resolve('dist/index.html'));await page.locator('#enter-slot').waitFor();};
const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('fruit-salon:v1')));
const input=async data=>{await page.click('[data-action=settings]');await page.setInputFiles('#import',{name:'backup.json',mimeType:'application/json',buffer:Buffer.from(typeof data==='string'?data:JSON.stringify(data))});};
try{
 await open();const imported={version:1,balance:20000,businesses:{barLevel:0,extraMachines:0,decorLevel:0},lastAccrualAtMs:Date.now()-24*3600000,remainderUnits:0,nextSpinId:1,lastSpin:null,selectedBet:{lineCount:5,perLine:1},settings:{muted:false,reducedMotion:false,effectsIntensity:.4}};
 await input(imported);await page.waitForFunction(()=>!document.querySelector('dialog').open);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('fruit-salon:v1')).balance>=20512);const accrued=await save();assert.equal(accrued.balance,20512);assert.equal(accrued.businesses.barLevel,0);await page.screenshot({path:'docs/salon-before.png'});
 for(const item of ['bar','machine','decor'])for(let i=1;i<=3;i++){await page.click('#buy-'+item);await page.waitForFunction(([key,n])=>JSON.parse(localStorage.getItem('fruit-salon:v1')).businesses[key]===n,[{bar:'barLevel',machine:'extraMachines',decor:'decorLevel'}[item],i]);assert.equal(await page.locator('#level-'+item).innerText(),i+' / 3');}
 const maxed=await save();assert.equal(maxed.balance,20512-11750);assert.deepEqual(maxed.businesses,{barLevel:3,extraMachines:3,decorLevel:3});assert.match(await page.locator('#income').innerText(),/160 tokens/);for(const item of ['bar','machine','decor'])assert.equal(await page.locator('#buy-'+item).isDisabled(),true);
 await page.click('#round');assert.equal((await save()).balance,maxed.balance-50);await page.screenshot({path:'docs/salon-max.png'});
 await page.click('[data-action=settings]');const download=page.waitForEvent('download');await page.click('#export');const backup=await download;const exported=JSON.parse(await readFile(await backup.path(),'utf8'));assert.deepEqual(exported.businesses,maxed.businesses);assert.equal(exported.version,1);await page.click('.close');
 const before=await save();await input('{bad');await page.waitForFunction(()=>document.querySelector('#import-status').textContent.length>0);assert.equal((await save()).balance,before.balance);await page.click('.close');
 await page.reload();await page.locator('#enter-slot').waitFor();assert.deepEqual((await save()).businesses,maxed.businesses);
 await page.addInitScript(()=>localStorage.setItem('fruit-salon:v1','{damaged-original'));await page.reload();await page.locator('#enter-slot').waitFor();assert.match(await page.locator('.save-warning').innerText(),/Damaged save protected/);
 await page.click('#enter-slot');await page.click('#spin');await page.waitForTimeout(1900);assert.equal(await page.evaluate(()=>localStorage.getItem('fruit-salon:v1')),'{damaged-original');
 await page.click('[data-action=settings]');assert.equal(await page.locator('#original').count(),1);await page.click('.close');
 await page.waitForFunction(()=>!document.querySelector('#spin').disabled);if((await page.locator('#spin').innerText()).includes('SKIP'))await page.click('#spin');await page.click('#back');await page.locator('#enter-slot').waitFor();
 await input(exported);await page.waitForFunction(()=>!document.querySelector('dialog').open);assert.deepEqual((await save()).businesses,maxed.businesses);
 const unavailable=await browser.newContext({viewport:{width:1280,height:720},offline:true});await unavailable.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('denied');}}));const denied=await unavailable.newPage();denied.on('pageerror',e=>errors.push(e.message));await denied.goto('file://'+resolve('dist/index.html'));await denied.locator('#enter-slot').waitFor();assert.match(await denied.locator('.save-warning').innerText(),/Storage is unavailable|Saving failed/);await denied.click('#enter-slot');await denied.click('#spin');await denied.waitForTimeout(1900);assert.match(await denied.locator('.save-warning').innerText(),/Saving failed/);await unavailable.close();
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);console.log('PASS: idle8h cap, all9 purchases visible and persistent, round50, export/import, invalid import atomic, damaged original protected through spin, recovery import, storage denied play-in-memory.');
}finally{console.log('errors',errors);await context.close();await browser.close();}
