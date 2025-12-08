import { Job } from 'bull';
import { AiService } from '../modules/ai/ai.service';
import { MessengerSendService } from '../modules/webhooks/messenger-send.service';
import { MessagesService } from '../modules/messages/messages.service';
export declare class AiQueueProcessor {
    private readonly aiService;
    private readonly messengerSendService;
    private readonly messagesService;
    private readonly logger;
    constructor(aiService: AiService, messengerSendService: MessengerSendService, messagesService: MessagesService);
    handleMessengerAiJob(job: Job): Promise<void>;
}
