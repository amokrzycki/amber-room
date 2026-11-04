import {spin,validBet} from './engine';
import {machine} from './machine';
import {createSession} from './session';
import type {SaveV1,SessionState} from './model';
export const SAVE_KEY='fruit-salon:v1';
export function createSave(nowMs:number):SaveV1 {
 return {version:1,balance:1000,businesses:{barLevel:0,extraMachines:0,decorLevel:0},lastAccrualAtMs:nowMs,remainderUnits:0,nextSpinId:1,lastSpin:null,selectedBet:{lineCount:5,perLine:1},settings:{muted:false,reducedMotion:false,effectsIntensity:0.65}};
}
const integer=(n:unknown,min=0,max=Number.MAX_SAFE_INTEGER)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=min&&n<=max;
export function parseSave(raw:string):SaveV1 {
 if(raw.length>100000)throw new Error('Zapis jest zbyt duży');
 const s=JSON.parse(raw);
 const invalid=()=>{throw new Error('Nieprawidłowy lub nieobsługiwany zapis');};
 if(!s||s.version!==1||!integer(s.balance)||!integer(s.lastAccrualAtMs)||!integer(s.remainderUnits,0,3599999)||!integer(s.nextSpinId,1)||!validBet(machine,s.selectedBet))invalid();
 if(!s.businesses||!['barLevel','extraMachines','decorLevel'].every(k=>integer(s.businesses[k],0,3)))invalid();
 if(!s.settings||typeof s.settings.muted!=='boolean'||typeof s.settings.reducedMotion!=='boolean'||typeof s.settings.effectsIntensity!=='number'||!Number.isFinite(s.settings.effectsIntensity)||s.settings.effectsIntensity<0||s.settings.effectsIntensity>1)invalid();
 if(s.lastSpin!==null){
  const r=s.lastSpin;
  if(!r||!integer(r.id,1)||r.id+1!==s.nextSpinId||!validBet(machine,r.bet)||r.totalStake!==r.bet.lineCount*r.bet.perLine||!r.outcome||!Array.isArray(r.outcome.stops)||r.outcome.stops.length!==5)invalid();
  let index=0;const expected=spin(machine,r.bet,()=>r.outcome.stops[index++]);
  const o=r.outcome;
  if(o.payout!==expected.payout||!Array.isArray(o.grid)||o.grid.length!==5||o.grid.some((c:unknown,i:number)=>!Array.isArray(c)||c.length!==3||c.some((v,j)=>v!==expected.grid[i][j]))||!Array.isArray(o.lineWins)||o.lineWins.length!==expected.lineWins.length||o.lineWins.some((w:any,i:number)=>!w||(['lineIndex','symbol','count','payout'] as const).some(k=>w[k]!==expected.lineWins[i][k])))invalid();
  s.lastSpin={id:r.id,bet:{lineCount:r.bet.lineCount,perLine:r.bet.perLine},totalStake:r.totalStake,outcome:expected};
 } else if(s.nextSpinId!==1)invalid();
 // Reconstruct known fields so imported objects cannot add executable/config state.
 return {version:1,balance:s.balance,businesses:{barLevel:s.businesses.barLevel,extraMachines:s.businesses.extraMachines,decorLevel:s.businesses.decorLevel},lastAccrualAtMs:s.lastAccrualAtMs,remainderUnits:s.remainderUnits,nextSpinId:s.nextSpinId,lastSpin:s.lastSpin,selectedBet:{lineCount:s.selectedBet.lineCount,perLine:s.selectedBet.perLine},settings:{...s.settings}};
}
export const exportSave=(save:SaveV1)=>JSON.stringify(save,null,2);
export function loadSave(storage:Pick<Storage,'getItem'>,nowMs:number):{kind:'new'|'loaded'|'invalid'|'unavailable';save:SaveV1;originalRaw?:string} {
 let raw:string|null;
 try{raw=storage.getItem(SAVE_KEY);}catch{return {kind:'unavailable',save:createSave(nowMs)};}
 if(raw===null)return {kind:'new',save:createSave(nowMs)};
 try{return {kind:'loaded',save:parseSave(raw)};}catch{return {kind:'invalid',save:createSave(nowMs),originalRaw:raw};}
}
export function writeSave(storage:Pick<Storage,'setItem'>,save:SaveV1):{ok:boolean} {
 try{storage.setItem(SAVE_KEY,exportSave(save));return {ok:true};}catch{return {ok:false};}
}
export class SaveOwner {
 state:SessionState; warning=''; originalRaw:string|undefined; private blocked=false;
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>,nowMs:number){
  const loaded=loadSave(storage,nowMs);this.state=createSession(loaded.save);this.originalRaw=loaded.originalRaw;
  this.blocked=loaded.kind==='invalid';
  if(this.blocked)this.warning='Uszkodzony zapis chroniony. Gra działa w pamięci. Pobierz oryginał lub importuj poprawną kopię.';
  else if(loaded.kind==='unavailable')this.warning='Pamięć niedostępna. Eksportuj postęp przed zamknięciem.';
 }
 commit(state:SessionState){
  this.state=state;
  if(this.blocked)return;
  this.warning=writeSave(this.storage,state.save).ok?'':'Nie udało się zapisać. Gra działa w pamięci — eksportuj postęp.';
 }
 import(raw:string){
  const save=parseSave(raw);
  this.blocked=false;this.originalRaw=undefined;this.commit(createSession(save));
 }
}
