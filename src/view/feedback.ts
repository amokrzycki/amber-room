import Phaser from 'phaser';
import {classifyWin,celebrationDuration,createCelebration} from '../game/feedback';
import type {SaveV1,SpinRecord} from '../game/model';
import {tuning as t} from './tuning';
export function playWin(scene:Phaser.Scene,spin:SpinRecord,settings:SaveV1['settings']){
 const tier=classifyWin(spin.totalStake,spin.outcome.payout);const strength=settings.effectsIntensity;
 const lines=scene.add.graphics();const frame=scene.add.graphics();
 if(strength>0){
  for(const w of [...spin.outcome.lineWins].sort((a,b)=>b.payout-a.payout).slice(0,1)){
   const path=scene.registry.get('paylines')[w.lineIndex] as number[];
   lines.lineStyle(1.5,0x35e6d1,.24*strength).beginPath();path.forEach((row,i)=>{if(i===0)lines.moveTo(t.reelX,t.reelY+row*t.rowGap);else lines.lineTo(t.reelX+i*t.reelGap,t.reelY+row*t.rowGap);});lines.strokePath();
   for(let i=0;i<w.count;i++)lines.lineStyle(2,0x35e6d1,.45*strength).strokeRoundedRect(t.reelX+i*t.reelGap-94,t.reelY+path[i]*t.rowGap-68,188,136,10);
  }
 }
 if((tier==='big'||tier==='jackpot')&&strength>0){
  frame.lineStyle(4,0xd8af55,.4*strength).strokeRoundedRect(263,192,1075,464,22);
  if(!settings.reducedMotion)scene.tweens.add({targets:frame,alpha:.45,duration:1100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
 }
 const handle=createCelebration(celebrationDuration(tier),()=>{scene.tweens.killTweensOf(frame);frame.destroy();lines.destroy();});
 return handle;
}
