import {expect,it} from 'vitest';
import {ReelView} from '../src/view/ReelView';
it('clears all symbol effects and restores rest state immediately',()=>{
 const active=new Set<any>();const images:any[]=[];
 const scene:any={add:{container(){return {add(){},setMask(){},removeAll(){},destroy(){}};},image(){const image={alpha:1,scaleX:1,scaleY:1,setDisplaySize(){this.scaleX=1;this.scaleY=1;return this;},setVisible(){return this;},setAlpha(a:number){this.alpha=a;return this;}};images.push(image);return image;}},make:{graphics(){return {fillStyle(){return this;},fillRect(){return this;},createGeometryMask(){return {destroy(){}};},destroy(){}};}},tweens:{add(config:any){active.add(config.targets);config.targets.alpha=.7;config.targets.scaleX=1.05;return {stop(){}};},killTweensOf(target:any){active.delete(target);}}};
 const reel=new ReelView(scene,0,['cherry','lemon','plum']);reel.highlight([0],.4,false);expect(active.size).toBeGreaterThan(0);
 (reel as any).clearHighlight();expect(active.size).toBe(0);expect(images[0].alpha).toBe(1);expect(images[0].scaleX).toBe(1);
});
