import {expect,it} from 'vitest';
import {createSave,parseSave,exportSave,loadSave,writeSave,SaveOwner} from '../src/game/save';
import {createSession,requestSpin} from '../src/game/session';
it('roundtrip preserves full state and validates outcome consistency',()=>{
 let save=createSave(100);save.businesses={barLevel:2,extraMachines:3,decorLevel:1};save.remainderUnits=3500;save.settings={muted:true,reducedMotion:true,effectsIntensity:0.3};
 const r=requestSpin(createSession(save),()=>11);if(r.ok)save=r.state.save;
 expect(parseSave(exportSave(save))).toEqual(save);
 for(const mutate of [(s:any)=>s.version=2,(s:any)=>s.balance=Number.MAX_SAFE_INTEGER+1,(s:any)=>s.selectedBet.lineCount=3,(s:any)=>s.lastSpin.totalStake=3,(s:any)=>s.lastSpin.outcome.grid[0][0]='oops',(s:any)=>s.lastSpin.outcome.payout++]){
  const copy=JSON.parse(exportSave(save));mutate(copy);expect(()=>parseSave(JSON.stringify(copy))).toThrow();
 }
 expect(()=>parseSave('{')).toThrow();
});
it('reports unavailable storage',()=>{
 expect(loadSave({getItem(){throw Error();}},0).kind).toBe('unavailable');
 expect(writeSave({setItem(){throw Error();}},createSave(0)).ok).toBe(false);
});
it('protects corrupt original after spin and permits deliberate validated import',()=>{
 let raw='{bad';const storage={getItem:()=>raw,setItem:(_k:string,v:string)=>{raw=v;}};
 const owner=new SaveOwner(storage,0);expect(owner.originalRaw).toBe('{bad');
 const r=requestSpin(owner.state,()=>0);if(r.ok)owner.commit(r.state);
 expect(raw).toBe('{bad');expect(owner.warning).toBeTruthy();
 const before=owner.state;expect(()=>owner.import('{broken')).toThrow();expect(owner.state).toBe(before);
 owner.import(exportSave(createSave(100)));expect(parseSave(raw)).toEqual(createSave(100));
});
it('refuses malformed ids, timestamps, settings and unreachable spin grids',()=>{
 for(const mutate of [(s:any)=>s.lastAccrualAtMs=-1,(s:any)=>s.remainderUnits=3600000,(s:any)=>s.nextSpinId=0,(s:any)=>s.settings.muted=0,(s:any)=>s.settings.effectsIntensity=2]){
  const s=createSave(0);mutate(s);expect(()=>parseSave(JSON.stringify(s))).toThrow();
 }
});
