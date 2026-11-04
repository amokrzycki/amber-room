import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import os from 'node:os';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1600,height:900},offline:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 const raf=requestAnimationFrame.bind(window);window.__frames=[];window.__callbacks=[];let previous=0;
 window.requestAnimationFrame=(cb)=>raf(t=>{if(previous)window.__frames.push(t-previous);previous=t;const start=performance.now();cb(t);window.__callbacks.push(performance.now()-start);});
 const rng=crypto.getRandomValues.bind(crypto);window.__stops=[];crypto.getRandomValues=a=>{if(window.__stops.length&&a instanceof Uint32Array){a[0]=window.__stops.shift();return a;}return rng(a);};
});
const client=await context.newCDPSession(page);await client.send('Performance.enable');
const memory=()=>client.send('Memory.getDOMCounters');
const stats=values=>{const sorted=[...values].sort((a,b)=>a-b);return {samples:values.length,mean:values.reduce((a,b)=>a+b,0)/values.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)};};
try{
 await page.goto('file://'+resolve('dist/index.html'));await page.locator('#enter-slot').waitFor();await page.click('#enter-slot');await page.locator('#spin').waitFor();await page.selectOption('#line-count','40');await page.selectOption('#per-line','5');
 // A large valid imported bankroll allows repeated maximum-stake observations without a production cheat UI.
 await page.click('[data-action=settings]');const save=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('fruit-salon:v1'));s.balance=10000;return s;});await page.setInputFiles('#import',{name:'perf-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});await page.locator('#enter-slot').waitFor();await page.click('#enter-slot');await page.locator('#spin').waitFor();
 await page.waitForTimeout(1000);await client.send('HeapProfiler.collectGarbage');const before=await memory();
 for(let i=0;i<12;i++){await page.click('#back');await page.locator('#enter-slot').waitFor();await page.click('#enter-slot');await page.locator('#spin').waitFor();}
 await page.waitForTimeout(500);await client.send('HeapProfiler.collectGarbage');const after=await memory();
 await page.evaluate(()=>{window.__frames=[];window.__callbacks=[];window.__stops=[9,10,10,10,9];});await page.click('#spin');await page.waitForTimeout(5200);
 const values=await page.evaluate(()=>({frames:window.__frames,callbacks:window.__callbacks,renderer:(()=>{const gl=document.querySelector('canvas').getContext('webgl2')||document.querySelector('canvas').getContext('webgl');const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown';})()}));
 const metrics=await client.send('Performance.getMetrics');const report={date:new Date().toISOString(),browser:browser.version(),os:os.platform()+' '+os.release(),cpu:os.cpus()[0].model,cpus:os.cpus().length,viewport:{width:1600,height:900},renderer:values.renderer,softwareRendering:true,recordVideo:false,case:'40 lines × 5, exact maximum payout 13055, stops9/10/10/10/9; 12 scene round trips',rafIntervalMs:stats(values.frames),mainCallbackMs:stats(values.callbacks),estimatedRafFps:1000/stats(values.frames).mean,domBefore:before,domAfter:after,performanceMetrics:metrics.metrics.filter(m=>['JSHeapUsedSize','Nodes','JSEventListeners','ScriptDuration','TaskDuration'].includes(m.name)),errors,limits:'Headless Chromium + SwiftShader. No user hardware, GPU timing or acoustic listening. RAF is not a guarantee of perceived 60FPS.'};writeFileSync('docs/performance-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 if(errors.length||after.jsEventListeners>before.jsEventListeners+5)process.exitCode=1;
}finally{await context.close();await browser.close();}
