import type {Businesses,SaveV1} from './model';
export const catalog={bar:{name:'Bar',field:'barLevel',prices:[500,1000,2000],gain:12},machine:{name:'Extra machines',field:'extraMachines',prices:[750,1500,3000],gain:20},decor:{name:'Furnishings',field:'decorLevel',prices:[300,900,1800],gain:0}} as const;
export type Item=keyof typeof catalog;
export const hourlyIncome=(b:Businesses)=>64+b.barLevel*catalog.bar.gain+b.extraMachines*catalog.machine.gain;
export function accrueIncome(save:SaveV1,nowMs:number):SaveV1 {
 if(!Number.isSafeInteger(nowMs)||nowMs<0)throw new RangeError('Invalid time');
 if(nowMs<=save.lastAccrualAtMs)return save;
 const elapsed=Math.min(nowMs-save.lastAccrualAtMs,8*3600000);
 const units=save.remainderUnits+elapsed*hourlyIncome(save.businesses);
 const balance=save.balance+Math.floor(units/3600000);
 if(!Number.isSafeInteger(balance))throw new RangeError('Safe number range exceeded. Export your save.');
 return {...save,balance,lastAccrualAtMs:nowMs,remainderUnits:units%3600000};
}
export function purchase(save:SaveV1,item:Item,nowMs:number):{ok:boolean;save:SaveV1;reason?:'insufficient-funds'|'max-level'} {
 const accrued=accrueIncome(save,nowMs);const entry=catalog[item];const level=accrued.businesses[entry.field];
 if(level===3)return {ok:false,save:accrued,reason:'max-level'};
 const cost=entry.prices[level];if(accrued.balance<cost)return {ok:false,save:accrued,reason:'insufficient-funds'};
 return {ok:true,save:{...accrued,balance:accrued.balance-cost,businesses:{...accrued.businesses,[entry.field]:level+1}}};
}
export function buyRound(save:SaveV1,nowMs:number):{ok:boolean;save:SaveV1} {
 const accrued=accrueIncome(save,nowMs);return accrued.balance<50?{ok:false,save:accrued}:{ok:true,save:{...accrued,balance:accrued.balance-50}};
}
