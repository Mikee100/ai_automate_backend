import { Test, TestingModule } from '@nestjs/testing';
import { ResponseHumanizerService, HumanizerContext } from './response-humanizer.service';
import { ToneProfile } from '../config/tones';
import { EMOJI_CONTEXT_MAP } from '../config/emoji';
import { WARM_OPENERS, WARM_CLOSERS } from '../config/phrases';
import { GREETING_SIMPLE_TEMPLATE } from '../config/naturalness';

describe('ResponseHumanizerService', () => {
  let service: ResponseHumanizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseHumanizerService],
    }).compile();

    service = module.get<ResponseHumanizerService>(ResponseHumanizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('humanizeResponse', () => {
    it('returns empty string unchanged', () => {
      expect(service.humanizeResponse('', {})).toBe('');
    });

    it('returns whitespace-only unchanged', () => {
      expect(service.humanizeResponse('   ', {})).toBe('   ');
    });

    it('runs full pipeline and softens tone', () => {
      const raw = 'Here are our available packages.';
      const ctx: HumanizerContext = {
        brandTone: ToneProfile.WARM_PROFESSIONAL,
        intent: { primaryIntent: 'package_inquiry' },
        lastAiResponses: [],
      };
      const result = service.humanizeResponse(raw, ctx);
      expect(result).toContain("Here's what we currently offer");
      expect(result).not.toContain('Here are our available packages');
    });

    it('respects custom pipeline order (SOFTEN only)', () => {
      const raw = 'Please provide the date.';
      const result = service.humanizeResponse(raw, {
        pipeline: ['SOFTEN'],
      });
      expect(result).toBe('What day works best for you?');
    });

    it('runs NATURALNESS first and strips theatrical package intro', () => {
      const raw = "Oh, my dear, I'm so delighted to share our studio packages with you! Each one is great.";
      const result = service.humanizeResponse(raw, {
        pipeline: ['NATURALNESS'],
        intent: { primaryIntent: 'package_inquiry' },
      });
      expect(result).not.toMatch(/oh,?\s*my dear/i);
      expect(result).not.toMatch(/so delighted/i);
      expect(result).toMatch(/Here are our (studio )?packages/);
    });

    it('simplifies long promotional greeting to short template', () => {
      const raw =
        "I've got you 💛 Thank you for contacting Fiesta House Maternity, Kenya's leading luxury photo studio. We specialize in professional maternity photography.";
      const result = service.humanizeResponse(raw, {
        pipeline: ['NATURALNESS'],
        isFirstMessage: true,
      });
      expect(result).toBe(GREETING_SIMPLE_TEMPLATE);
    });

    it('skips unknown pipeline steps without throwing', () => {
      const result = service.humanizeResponse('Hello', {
        pipeline: ['SOFTEN', 'UNKNOWN' as any, 'EMOJI'],
      });
      expect(result).toBeDefined();
    });
  });

  describe('softenTone', () => {
    it('applies formal → conversational replacements', () => {
      expect(service.softenTone('Here are our available packages.')).toContain("Here's what we currently offer");
      expect(service.softenTone('Please provide the date.')).toBe('What day works best for you?');
      expect(service.softenTone('Please reply confirm to proceed.')).toContain(
        "If everything looks good, just reply confirm and I'll take care of the rest",
      );
      expect(service.softenTone('Your booking has been created.')).toContain("You're all set!");
      expect(service.softenTone('Your payment link has been sent.')).toContain("I've just sent your payment link");
    });

    it('leaves unrelated text unchanged', () => {
      const text = 'The Standard package is KES 15,000.';
      expect(service.softenTone(text)).toBe(text);
    });
  });

  describe('chunkForReadability', () => {
    it('returns text unchanged when 1–2 sentences', () => {
      const one = 'Hello there.';
      expect(service.chunkForReadability(one)).toBe(one);
      const two = 'First sentence. Second sentence.';
      expect(service.chunkForReadability(two)).toBe(two);
    });

    it('splits 3+ sentences into chunks of 1–2', () => {
      const text = 'We are at X. We open at Y. We offer Z.';
      const result = service.chunkForReadability(text);
      expect(result).toContain('\n\n');
      const parts = result.split('\n\n');
      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(parts.every((p) => p.length > 0)).toBe(true);
    });
  });

  describe('mirrorEmotion', () => {
    it('prepends phrase for anxious', () => {
      const result = service.mirrorEmotion('Here is the info.', 'anxious');
      expect(result).toContain("No worries at all");
      expect(result).toContain("Here is the info.");
    });

    it('prepends phrase for excited', () => {
      const result = service.mirrorEmotion('Book now.', 'excited');
      expect(result).toContain("This is going to be beautiful");
      expect(result).toContain("Book now.");
    });

    it('prepends phrase for frustrated', () => {
      const result = service.mirrorEmotion('Fixed.', 'frustrated');
      expect(result).toContain("I'm really sorry");
      expect(result).toContain("Fixed.");
    });

    it('prepends phrase for confused', () => {
      const result = service.mirrorEmotion('Step one. Step two.', 'confused');
      expect(result).toContain("Let me break that down simply");
      expect(result).toContain("Step one. Step two.");
    });

    it('leaves text unchanged for neutral/unknown tone', () => {
      const text = 'Just the facts.';
      expect(service.mirrorEmotion(text, 'neutral')).toBe(text);
      expect(service.mirrorEmotion(text, '')).toBe(text);
      expect(service.mirrorEmotion(text)).toBe(text);
    });

    it('skips emotion prepend for package_inquiry (soft emotion only)', () => {
      const text = 'Here are our packages.';
      const result = service.mirrorEmotion(text, 'anxious', 'package_inquiry');
      expect(result).toBe(text);
      expect(result).not.toContain('No worries at all');
    });

    it('skips emotion prepend for faq (soft emotion only)', () => {
      const text = 'Our studio is open 9–6.';
      const result = service.mirrorEmotion(text, 'excited', 'faq');
      expect(result).toBe(text);
    });
  });

  describe('injectEmoji', () => {
    it('appends 1–2 emojis from allowed set for WARM_PROFESSIONAL', () => {
      const text = 'Your booking is confirmed.';
      const ctx: HumanizerContext = {
        brandTone: ToneProfile.WARM_PROFESSIONAL,
        isBookingFlow: true,
        intent: { primaryIntent: 'booking' },
      };
      const result = service.injectEmoji(text, ctx);
      expect(result.length).toBeGreaterThan(text.length);
      const allowed = EMOJI_CONTEXT_MAP.BOOKING_SUCCESS;
      expect(allowed.some((e) => result.includes(e))).toBe(true);
    });

    it('does not add emojis for CLINICAL_FORMAL (emojiFrequency none)', () => {
      const text = 'Your booking is confirmed.';
      const result = service.injectEmoji(text, {
        brandTone: ToneProfile.CLINICAL_FORMAL,
        isBookingFlow: true,
      });
      expect(result).toBe(text);
    });
  });

  describe('applyVariation', () => {
    it('skips opener/closer when isEscalation', () => {
      const text = 'Connecting you with our team.';
      const result = service.applyVariation(text, {
        isEscalation: true,
        intent: { primaryIntent: 'faq' },
        lastAiResponses: [],
      });
      expect(result).toBe(text);
      expect(WARM_OPENERS.every((o) => !result.startsWith(o))).toBe(true);
      expect(WARM_CLOSERS.every((c) => !result.endsWith(c))).toBe(true);
    });

    it('skips opener/closer when requiresHumanHandoff', () => {
      const text = 'Let me help.';
      const result = service.applyVariation(text, {
        intent: { primaryIntent: 'complaint', requiresHumanHandoff: true },
        lastAiResponses: [],
      });
      expect(result).toBe(text);
    });

    it('skips opener/closer for skip intents (e.g. escalation)', () => {
      const text = 'One moment.';
      const result = service.applyVariation(text, {
        intent: { primaryIntent: 'escalation' },
        lastAiResponses: [],
      });
      expect(result).toBe(text);
    });

    it('can add opener/closer for package_inquiry when no recent use', () => {
      const text = 'Here are our packages.';
      const result = service.applyVariation(text, {
        intent: { primaryIntent: 'package_inquiry' },
        lastAiResponses: [],
      });
      const hasOpener = WARM_OPENERS.some((o) => result.startsWith(o));
      const hasCloser = WARM_CLOSERS.some((c) => result.includes(c));
      expect(hasOpener || hasCloser).toBe(true);
    });

    it('avoids repeating opener that appears in lastAiResponses', () => {
      const usedOpener = WARM_OPENERS[0];
      const text = 'Here is the info.';
      const result = service.applyVariation(text, {
        intent: { primaryIntent: 'faq' },
        lastAiResponses: [usedOpener + ' Something else.', 'Another message.'],
      });
      expect(result.startsWith(usedOpener)).toBe(false);
    });
  });

  describe('integration examples', () => {
    it('transforms "Here are our packages" to humanized style', () => {
      const raw = 'Here are our packages.';
      const ctx: HumanizerContext = {
        brandTone: ToneProfile.WARM_PROFESSIONAL,
        intent: { primaryIntent: 'package_inquiry' },
        lastAiResponses: [],
      };
      const result = service.humanizeResponse(raw, ctx);
      expect(result).toContain("Here's what we currently offer");
    });

    it('transforms "Please reply confirm to proceed" to humanized style', () => {
      const raw = 'Please reply confirm to proceed.';
      const ctx: HumanizerContext = {
        brandTone: ToneProfile.WARM_PROFESSIONAL,
        intent: { primaryIntent: 'booking' },
        isBookingFlow: true,
        lastAiResponses: [],
      };
      const result = service.humanizeResponse(raw, ctx);
      expect(result).toContain("If everything looks good");
      expect(result).toContain("confirm");
    });

    it('does not change facts (numbers, package names)', () => {
      const raw = 'The Standard package costs KES 15,000. Deposit is KES 5,000.';
      const result = service.humanizeResponse(raw, {
        pipeline: ['SOFTEN'],
      });
      expect(result).toContain('15,000');
      expect(result).toContain('5,000');
      expect(result).toContain('Standard');
    });

    it('replaces theatrical package line with natural phrasing', () => {
      const raw = "Oh, my dear, I'm so delighted to share our studio packages with you!";
      const result = service.humanizeResponse(raw, {
        pipeline: ['NATURALNESS'],
      });
      expect(result).toContain('Here are our studio packages');
      expect(result).not.toMatch(/so delighted|oh,?\s*my dear/i);
    });

    it('replaces "thoughtfully crafted to celebrate your beautiful journey" with grounded phrasing', () => {
      const raw = 'Each one is thoughtfully crafted to celebrate your beautiful journey.';
      const result = service.humanizeResponse(raw, {
        pipeline: ['NATURALNESS'],
      });
      expect(result).toContain('designed to give you');
      expect(result).toContain('beautiful, relaxed maternity shoot experience');
      expect(result).not.toContain('thoughtfully crafted to celebrate');
    });

    it('replaces template-structured booking confirmation with natural rhythm', () => {
      const raw = 'Thank you for your request! I have noted your booking for this Thursday at 2:00 PM with the Standard Package.';
      const result = service.humanizeResponse(raw, {
        pipeline: ['NATURALNESS'],
      });
      expect(result).toMatch(/Perfect\.|Got it\./);
      expect(result).toMatch(/I've locked in|Booked for/);
      expect(result).not.toContain('Thank you for your request!');
      expect(result).not.toContain('I have noted your booking for');
    });

    it('replaces "I\'m glad to hear" and "feel free to reach out" with short phrasing', () => {
      const raw = "I'm glad to hear you're doing well! If you ever have questions in the future or need assistance, feel free to reach out.";
      const result = service.humanizeResponse(raw, {
        pipeline: ['NATURALNESS'],
      });
      expect(result).toContain('All good then');
      expect(result).toContain('If anything comes up later, just message me');
      expect(result).not.toMatch(/feel free to reach out/i);
    });

    it('respects customerProfile.emojiTolerance low (no emoji added)', () => {
      const text = 'Your booking is confirmed.';
      const result = service.injectEmoji(text, {
        brandTone: ToneProfile.WARM_PROFESSIONAL,
        isBookingFlow: true,
        customerProfile: { emojiTolerance: 'low' },
      });
      expect(result).toBe(text);
    });

    it('uses different opener pool for formalityLevel high (neutral openers)', () => {
      const text = 'Here is the info.';
      const result = service.applyVariation(text, {
        intent: { primaryIntent: 'faq' },
        lastAiResponses: [],
        customerProfile: { formalityLevel: 'high' },
      });
      const neutralOpeners = ['Sure.', 'Of course.', 'Here you go.', 'Done.'];
      const hasNeutral = neutralOpeners.some((o) => result.startsWith(o));
      expect(hasNeutral || result === text).toBe(true);
    });
  });
});
