import { symbols, type Bet, type LineWin, type MachineConfig, type Rng, type SpinOutcome, type SymbolId } from './model';
export function validBet(config:MachineConfig,bet:Bet):boolean {
  return !!bet && config.allowedLineCounts.includes(bet.lineCount) && config.allowedPerLine.includes(bet.perLine);
}
export function evaluate(config:MachineConfig,grid:SymbolId[][],bet:Bet):LineWin[] {
  if(!validBet(config,bet) || grid.length!==5 || grid.some(c=>c.length!==3 || c.some(s=>!symbols.includes(s)))) throw new RangeError('Nieprawidłowy zakład lub siatka');
  const wins:LineWin[]=[];
  for(let lineIndex=0;lineIndex<bet.lineCount;lineIndex++) {
    const path=config.paylines[lineIndex];
    let best:LineWin|undefined;
    for(const symbol of symbols) {
      let count=0;
      while(count<5 && (grid[count][path[count]]===symbol || (symbol!=='wild' && grid[count][path[count]]==='wild'))) count++;
      if(count<3) continue;
      const payout=config.paytable[symbol][count-3]*bet.perLine;
      if(!best || payout>best.payout) best={lineIndex,symbol,count,payout};
    }
    if(best) wins.push(best);
  }
  return wins;
}
export function spin(config:MachineConfig,bet:Bet,rng:Rng):SpinOutcome {
  if(!validBet(config,bet)) throw new RangeError('Nieprawidłowy zakład');
  const stops=config.reels.map(reel=> {
    const stop=rng(reel.length);
    if(!Number.isInteger(stop)||stop<0||stop>=reel.length) throw new RangeError('Nieprawidłowy RNG');
    return stop;
  });
  const grid=config.reels.map((reel,i)=>Array.from({length:3},(_,r)=>reel[(stops[i]+r)%reel.length]));
  const lineWins=evaluate(config,grid,bet);
  return {stops,grid,lineWins,payout:lineWins.reduce((n,w)=>n+w.payout,0)};
}
export const secureRng:Rng=(max)=> {
  if(!Number.isSafeInteger(max)||max<=0||max>0x100000000) throw new RangeError('Nieprawidłowy zakres RNG');
  const limit=Math.floor(0x100000000/max)*max;
  const value=new Uint32Array(1);
  do { crypto.getRandomValues(value); } while(value[0]>=limit);
  return value[0]%max;
};
