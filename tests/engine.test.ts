import { describe, expect, it } from 'vitest';
import { machine } from '../src/game/machine';
import { evaluate, spin } from '../src/game/engine';
import type { Bet, SymbolId } from '../src/game/model';

describe('slot mathematics', () => {
  it('catalogHas40UniquePaths', () => {
    expect(new Set(machine.paylines.map(p => p.join(''))).size).toBe(40);
    expect(machine.paylines.every(p => p.length === 5 && p.every(r => [0,1,2].includes(r)))).toBe(true);
    expect(machine.paylines.slice(0,5)).toEqual([[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2]]);
  });
  it('wrapsReelAtLastStop', () => expect(spin(machine,{lineCount:1,perLine:1},()=>11).grid[0]).toEqual(['wild','cherry','lemon']));
  it('activePrefixOnlyPays', () => {
    const grid: SymbolId[][] = Array.from({length:5},()=>['cherry','lemon','plum']);
    const all = evaluate(machine,grid,{lineCount:40,perLine:1});
    for (const lineCount of machine.allowedLineCounts) expect(evaluate(machine,grid,{lineCount,perLine:1} as Bet)).toEqual(all.filter(w=>w.lineIndex<lineCount));
  });
  it('linePriceDoesNotDependOnTotalLines',()=> {
    const grid: SymbolId[][]=Array.from({length:5},()=>['lemon','cherry','plum']);
    expect(evaluate(machine,grid,{lineCount:5,perLine:2})[0].payout).toBe(30);
    expect(evaluate(machine,grid,{lineCount:40,perLine:2})[0].payout).toBe(30);
  });
  it('bestWildMatchOnly',()=> {
    const grid: SymbolId[][]=['wild','wild','wild','seven','seven'].map(s=>[s,s,s] as SymbolId[]);
    expect(evaluate(machine,grid,{lineCount:1,perLine:1})).toEqual([{lineIndex:0,symbol:'seven',count:5,payout:120}]);
  });
  it('rejectsInvalidInputs',()=> {
    for (const bet of [{lineCount:3,perLine:1},{lineCount:5,perLine:0},{lineCount:NaN,perLine:1}]) expect(()=>spin(machine,bet as Bet,()=>0)).toThrow(RangeError);
    for (const stop of [-1,12,NaN,0.5]) expect(()=>spin(machine,{lineCount:5,perLine:1},()=>stop)).toThrow(RangeError);
  });
});

it('rare five wilds keep a jackpot meaningful against a day of business income',()=>{expect(evaluate(machine,Array.from({length:5},()=>['wild','wild','wild']),{lineCount:1,perLine:1})[0].payout).toBe(2000);});
