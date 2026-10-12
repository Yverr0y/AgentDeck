import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { backgroundCount, backgroundLabel, backgroundCompact } from '../background-work-presentation.js';
import { BACKGROUND_WORK_POLICY } from '../background-work.js';
import { BACKGROUND_PRESENTATION } from '../background-work-presentation.js';
import { MatrixExpression } from '../matrix-expression.js';

describe('background work device projection', () => {
  it('keeps malformed/unknown separate from explicit completion and bounded counts', () => {
    for(const value of [undefined,null,-1,1.5,Infinity,NaN,true,'2',4097]) expect(backgroundCount(value)).toBeNull();
    expect(backgroundLabel(0)).toBe('Background complete');
    expect(backgroundCompact(4096)).toBe('BG 4096');
    expect(BACKGROUND_PRESENTATION.maxCount).toBe(BACKGROUND_WORK_POLICY.maxItems);
  });
  it('retains by session id across reordering and clears only on an explicit zero or disconnect', () => {
    const engine=new MatrixExpression();
    const row=(id:string,count?:number) => ({id,alive:true,state:'processing',backgroundTaskCount:count});
    engine.updateSessions([row('a',3),row('b',2)],0);
    expect(engine.scene(0).backgroundCount).toBe(5);
    engine.updateSessions([row('b'),row('a',0)],1);
    expect(engine.scene(1).backgroundCount).toBe(2);
    engine.updateSessions([row('a',0)],2);
    expect(engine.scene(2).backgroundCount).toBe(0);
    engine.reset(); engine.updateSessions([row('b')],3);
    expect(engine.scene(3).backgroundCount).toBe(-1);
  });
  it('keeps generated Kotlin, C++ and Swift policies synchronized', () => {
    expect(() => execFileSync(process.execPath,['scripts/generate-background-presentation.mjs','--check'])).not.toThrow();
  });
});
