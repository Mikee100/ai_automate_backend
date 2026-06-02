import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  const prismaMock = {
    escalation: {
      create: jest.fn(),
    },
  } as any;

  let service: CircuitBreakerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CircuitBreakerService(prismaMock);
  });

  it('does not trip when assistant replies are varied', async () => {
    const messages = [
      { role: 'assistant', content: 'Hi there, how can I help you today?' },
      { role: 'user', content: 'Tell me about your packages' },
      { role: 'assistant', content: 'Sure, we have Standard and VIP options.' },
      { role: 'user', content: 'What is included in VIP?' },
      { role: 'assistant', content: 'VIP includes makeup, styling, and premium edits.' },
    ] as any;

    const result = await service.checkAndBreak('cust_1', messages);

    expect(result.shouldBreak).toBe(false);
    expect(result.recovery).toBe('retry');
  });

  it('trips when assistant repeats similar responses 4+ times', async () => {
    const repeated = 'I can help you with that. Please share your preferred date and time.';
    const messages = [
      { role: 'assistant', content: repeated },
      { role: 'user', content: 'tomorrow' },
      { role: 'assistant', content: repeated },
      { role: 'user', content: 'tomorrow morning' },
      { role: 'assistant', content: repeated },
      { role: 'user', content: 'same request' },
      { role: 'assistant', content: repeated },
    ] as any;

    const result = await service.checkAndBreak('cust_2', messages);

    expect(result.shouldBreak).toBe(true);
    expect(result.recovery).toBe('escalate');
    expect(result.repetitionCount).toBeGreaterThanOrEqual(4);
  });

  it('trips on clear user frustration pattern', async () => {
    const messages = [
      { role: 'assistant', content: 'Can you confirm your preferred package?' },
      { role: 'user', content: 'this is not working' },
      { role: 'assistant', content: 'Could you please repeat that?' },
      { role: 'user', content: 'seriously??' },
      { role: 'assistant', content: 'Can you share it again?' },
      { role: 'user', content: 'help' },
    ] as any;

    const result = await service.checkAndBreak('cust_3', messages);

    expect(result.shouldBreak).toBe(true);
    expect(result.recovery).toBe('simplify');
    expect(result.reason).toContain('User frustration');
  });

  it('records trip escalation in database', async () => {
    await service.recordTrip('cust_4', 'test reason');

    expect(prismaMock.escalation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust_4',
          reason: 'ai_circuit_breaker',
          description: 'test reason',
        }),
      })
    );
  });
});
