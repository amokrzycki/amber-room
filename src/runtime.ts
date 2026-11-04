import {SaveOwner} from './game/save';
import {accrueIncome} from './game/business';
let storage:Pick<Storage,'getItem'|'setItem'>;
try{storage=window.localStorage;}catch{storage={getItem(){throw new Error('storage unavailable');},setItem(){throw new Error('storage unavailable');}};}
export const owner=new SaveOwner(storage,Date.now());
export const number=(n:number)=>n.toLocaleString('en-GB');
export function accrue(nowMs=Date.now()){
 try{const save=accrueIncome(owner.state.save,nowMs);if(save!==owner.state.save){owner.commit({...owner.state,save});window.dispatchEvent(new Event('salon-state'));}}
 catch(error){owner.warning=error instanceof Error?error.message:'Income could not be saved';window.dispatchEvent(new Event('salon-state'));}
}
