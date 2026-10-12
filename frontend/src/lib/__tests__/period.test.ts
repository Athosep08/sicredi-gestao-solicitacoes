import { describe, expect, it } from 'vitest';
import { readPeriod } from '../period';

describe('readPeriod', () => {
  it('aceita datas válidas e período aberto em uma das pontas', () => {
    expect(readPeriod({ from: '2026-10-01', to: '2026-10-12' })).toEqual({ from: '2026-10-01', to: '2026-10-12', error: undefined });
    expect(readPeriod({ from: '2026-10-01' })).toEqual({ from: '2026-10-01', to: undefined, error: undefined });
    expect(readPeriod({ from: '', to: '' })).toEqual({ from: undefined, to: undefined, error: undefined });
  });

  it('descarta data inexistente, formato errado e início depois do fim, com aviso', () => {
    for (const sp of [{ from: '2026-02-31' }, { to: '12/10/2026' }, { from: '2026-10-12', to: '2026-10-01' }]) {
      const p = readPeriod(sp);
      expect(p.from).toBeUndefined();
      expect(p.to).toBeUndefined();
      expect(p.error).toBeTruthy();
    }
  });
});
