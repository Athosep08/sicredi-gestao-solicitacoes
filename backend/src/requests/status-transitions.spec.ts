import { RequestStatus } from '../common/enums';
import { canTransition, isFinalDecision } from './status-transitions';

describe('status-transitions', () => {
  it.each([
    [RequestStatus.OPEN, RequestStatus.IN_ANALYSIS],
    [RequestStatus.OPEN, RequestStatus.APPROVED],
    [RequestStatus.OPEN, RequestStatus.REJECTED],
    [RequestStatus.IN_ANALYSIS, RequestStatus.APPROVED],
    [RequestStatus.IN_ANALYSIS, RequestStatus.REJECTED],
  ])('permite %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([RequestStatus.APPROVED, RequestStatus.REJECTED])('permite reabrir uma solicitação %s', (from) => {
    expect(canTransition(from, RequestStatus.OPEN)).toBe(true);
    expect(canTransition(from, RequestStatus.IN_ANALYSIS)).toBe(true);
  });

  it('não permite ir direto de aprovada para rejeitada (precisa reabrir antes)', () => {
    expect(canTransition(RequestStatus.APPROVED, RequestStatus.REJECTED)).toBe(false);
    expect(canTransition(RequestStatus.REJECTED, RequestStatus.APPROVED)).toBe(false);
  });

  it.each(Object.values(RequestStatus))('não permite manter o mesmo status (%s)', (s) => {
    expect(canTransition(s, s)).toBe(false);
  });

  it('só aprovada e rejeitada são decisões finais', () => {
    expect(isFinalDecision(RequestStatus.APPROVED)).toBe(true);
    expect(isFinalDecision(RequestStatus.REJECTED)).toBe(true);
    expect(isFinalDecision(RequestStatus.OPEN)).toBe(false);
    expect(isFinalDecision(RequestStatus.IN_ANALYSIS)).toBe(false);
  });
});
