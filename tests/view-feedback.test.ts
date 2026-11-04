import {expect,it,vi} from 'vitest';
import {playWin} from '../src/view/feedback';
import {machine} from '../src/game/machine';
import {spin} from '../src/game/engine';
it('shows a returned winning line briefly without a profit celebration and disposes it immediately on request',()=>{
 vi.useFakeTimers();const layers:{visible:boolean}[]=[];
 const scene:any={registry:{get:()=>machine.paylines},add:{graphics(){const layer:any={visible:true};for(const method of ['lineStyle','beginPath','moveTo','lineTo','strokePath','strokeRoundedRect'])layer[method]=()=>layer;layer.destroy=()=>{layer.visible=false;};layers.push(layer);return layer;}},tweens:{killTweensOf(){},add(){}}};
 let i=0;const outcome=spin(machine,{lineCount:5,perLine:1},()=>[2,1,0,0,0][i++]);expect(outcome.payout).toBe(4);
 const view=playWin(scene,{id:1,bet:{lineCount:5,perLine:1},totalStake:5,outcome},{muted:false,reducedMotion:true,effectsIntensity:.4});
 vi.advanceTimersByTime(1);expect(layers[0].visible).toBe(true);view.dispose();expect(layers[0].visible).toBe(false);expect(vi.getTimerCount()).toBe(0);vi.useRealTimers();
});
