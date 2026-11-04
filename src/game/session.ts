import {spin,validBet} from './engine';
import {machine} from './machine';
import type {Bet,Rng,SaveV1,SessionState,SpinDecision} from './model';
export const createSession=(save:SaveV1):SessionState=>({save,phase:'ready',activeSpinId:null});
export function selectBet(state:SessionState,bet:Bet):SessionState {
  if(state.phase!=='ready')return state;
  if(!validBet(machine,bet))throw new RangeError('Nieprawidłowy zakład');
  return {...state,save:{...state.save,selectedBet:{...bet}}};
}
export function requestSpin(state:SessionState,rng:Rng):SpinDecision {
  if(state.phase!=='ready')return {ok:false,state,reason:'busy'};
  const bet={...state.save.selectedBet};
  if(!validBet(machine,bet))return {ok:false,state,reason:'invalid-bet'};
  const totalStake=bet.lineCount*bet.perLine;
  if(state.save.balance<totalStake)return {ok:false,state,reason:'insufficient-funds'};
  const outcome=spin(machine,bet,rng);
  const balance=state.save.balance-totalStake+outcome.payout;
  if(!Number.isSafeInteger(balance)||!Number.isSafeInteger(state.save.nextSpinId+1))throw new RangeError('Przekroczono bezpieczny zakres liczb; wyeksportuj zapis.');
  const record={id:state.save.nextSpinId,bet,totalStake,outcome};
  return {ok:true,spin:record,state:{save:{...state.save,balance,nextSpinId:record.id+1,lastSpin:record},phase:'spinning',activeSpinId:record.id}};
}
export function reelsStopped(state:SessionState,id:number):SessionState {
  return state.phase==='spinning'&&state.activeSpinId===id?{...state,phase:'celebrating'}:state;
}
export function finishSpin(state:SessionState,id:number):SessionState {
  return state.phase==='celebrating'&&state.activeSpinId===id?{...state,phase:'ready',activeSpinId:null}:state;
}
