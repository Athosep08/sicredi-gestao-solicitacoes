import { describe, expect, it } from 'vitest';
import { allowedNextStatuses, isStaff } from '../status';

describe('allowedNextStatuses', () => {
  it('nunca oferece o mesmo status', () => {
    for (const s of ['open', 'in_analysis', 'approved', 'rejected'] as const) {
      expect(allowedNextStatuses(s)).not.toContain(s);
    }
  });

  it('de aprovada/rejeitada só dá para reabrir', () => {
    expect(allowedNextStatuses('approved')).toEqual(['open', 'in_analysis']);
    expect(allowedNextStatuses('rejected')).toEqual(['open', 'in_analysis']);
  });
});

describe('isStaff', () => {
  it('só atendente e supervisor', () => {
    expect(isStaff('agent')).toBe(true);
    expect(isStaff('supervisor')).toBe(true);
    expect(isStaff('requester')).toBe(false);
  });
});
