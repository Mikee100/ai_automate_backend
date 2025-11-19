# TODO: Fix TypeScript Compilation Errors

## Steps to Complete
- [ ] Update `ai.service.ts`: Rename `retrieveFaq` to `answerFaq`, add optional `history` parameter, update `processAiRequest`
- [ ] Add `extractStepBasedBookingDetails` method in `ai.service.ts`
- [ ] Add `generateStepBasedBookingResponse` method in `ai.service.ts`
- [ ] Update `message-queue.processor.ts`: Convert history format, change method calls to match new signatures
- [ ] Update `webhooks.service.ts`: Change `answerFaq` calls to include empty history array
- [ ] Update `ai.controller.ts`: Change `answerFaq` call to include empty history array
- [ ] Run TypeScript compilation to verify fixes
- [ ] Test the application functionality
