import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:1280,height:720},offline:true});const page=await context.newPage();await page.goto('file://'+resolve('dist/index.html'));await page.locator('#enter-slot').waitFor();
 const result=await page.evaluate(()=>{
  const before=JSON.parse(localStorage.getItem('fruit-salon:v1'));let now=before.lastAccrualAtMs;Date.now=()=>now;
  let hidden=true;Object.defineProperty(document,'hidden',{get:()=>hidden,configurable:true});document.dispatchEvent(new Event('visibilitychange'));
  now+=24*3600000;window.dispatchEvent(new Event('pagehide'));const whileHidden=JSON.parse(localStorage.getItem('fruit-salon:v1'));
  hidden=false;document.dispatchEvent(new Event('visibilitychange'));const returned=JSON.parse(localStorage.getItem('fruit-salon:v1'));
  return {before,whileHidden,returned};
 });
 assert.equal(result.whileHidden.lastAccrualAtMs,result.before.lastAccrualAtMs,'Closing a hidden tab must not split one absence into multiple paid breaks');
 assert.equal(result.returned.balance,result.before.balance+512);assert.equal(result.returned.lastAccrualAtMs,result.before.lastAccrualAtMs+24*3600000);
 console.log('PASS: hidden close does not checkpoint another break; 24h absence settles exactly 8h once.');await context.close();
}finally{await browser.close();}
