import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private pinecone: Pinecone;
  private index: any;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @InjectQueue('aiQueue') private aiQueue: Queue,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });

    this.pinecone = new Pinecone({
      apiKey: this.configService.get('PINECONE_API_KEY'),
      environment: this.configService.get('PINECONE_ENVIRONMENT'),
    });

    this.index = this.pinecone.index(this.configService.get('PINECONE_INDEX_NAME', 'business-kb'));
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.configService.get('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
      input: text,
    });
    return response.data[0].embedding;
  }

  async retrieveRelevantDocs(query: string, topK = 5): Promise<any[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const response = await this.index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });
    return response.matches;
  }

  // Unified FAQ handler
  async answerFaq(question: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
    try {
      const relevantDocs = await this.retrieveRelevantDocs(question, 3);
      const messages: any[] = [
        { role: 'system', content: 'You are a helpful salon assistant. Answer questions based ONLY on the provided context. If the context doesn\'t contain the answer, say "I\'m not sure about that but I can check for you." Keep answers concise and friendly.' }
      ];

      relevantDocs.forEach((doc, index) => {
        messages.push({ role: 'system', content: `Context ${index + 1}: ${doc.metadata.answer}` });
      });

      messages.push(...history.map(h => ({ role: h.role, content: h.content })));
      messages.push({ role: 'user', content: question });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 200,
      });
      return response.choices[0].message.content || 'I\'m not sure about that but I can check for you.';
    } catch (error) {
      console.error('FAQ retrieval failed:', error);
      return 'I\'m not sure about that but I can check for you.';
    }
  }

  // Unified extraction for booking details
  async extractBookingDetails(message: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<{ service?: string; date?: string; time?: string; name?: string; subIntent: 'start' | 'provide' | 'confirm' | 'cancel' | 'unknown' }> {
    const messages: any[] = [
      { role: 'system', content: `You are a booking detail extractor for a salon assistant. Analyze the message and return ONLY this JSON format:
{
  "service": string | undefined,
  "date": string | undefined,
  "time": string | undefined,
  "name": string | undefined,
  "subIntent": "start" | "provide" | "confirm" | "cancel" | "unknown"
}

Rules:
- Extract ONLY explicitly mentioned details from the CURRENT message (not history).
- service: e.g., "haircut", "manicure"
- date: e.g., "tomorrow", "next Friday", "2024-01-15"
- time: e.g., "9 AM", "afternoon"
- name: customer's name
- subIntent: "start" if user wants to book, "provide" if giving details, "confirm" if agreeing, "cancel" if canceling, "unknown" otherwise
- Do NOT assume or invent values
- Do NOT add extra fields or commentary` }
    ];

    messages.push(...history.slice(-4).map(h => ({ role: h.role, content: h.content }))); // Limited history for context
    messages.push({ role: 'user', content: message });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 150,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content?.trim();
    try {
      const parsed = JSON.parse(content || '{}');
      return {
        service: typeof parsed.service === 'string' ? parsed.service : undefined,
        date: typeof parsed.date === 'string' ? parsed.date : undefined,
        time: typeof parsed.time === 'string' ? parsed.time : undefined,
        name: typeof parsed.name === 'string' ? parsed.name : undefined,
        subIntent: ['start', 'provide', 'confirm', 'cancel', 'unknown'].includes(parsed.subIntent as string) ? parsed.subIntent as any : 'unknown'
      };
    } catch {
      return { subIntent: 'unknown' };
    }
  }

  // Internal response generator for booking (unified)
  private async generateBookingResponse(message: string, draft: any, extraction: any): Promise<string> {
    const missingFields = [];
    if (!draft.service) missingFields.push('service');
    if (!draft.date) missingFields.push('date');
    if (!draft.time) missingFields.push('time');
    if (!draft.name) missingFields.push('name');

    let currentStep = draft.step || 'service';
    if (missingFields.length === 0) currentStep = 'confirm';

    const systemPrompt = `You are a warm, friendly salon receptionist. 
Your goal is to COMPLETE the booking by asking ONE missing detail at a time.

RULES:
- Never repeat a question if the user already answered.
- Never introduce new information not provided.
- Keep responses short (1–2 sentences).
- Stay friendly and natural.
- If all details are collected, summarize and ask for confirmation.
- If the user confirms, finalize the booking.
- If the user cancels, politely reset.

BOOKING STATE:
Service: ${draft.service || 'missing'}
Date: ${draft.date || 'missing'}
Time: ${draft.time || 'missing'}
Name: ${draft.name || 'missing'}
Current Step: ${currentStep}

USER JUST SAID:
${message}

EXTRACTED FROM USER MESSAGE:
${JSON.stringify(extraction)}

OUTPUT:
Your next conversational response.
Ask ONLY for the next missing detail.`;

    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    messages.push({ role: 'user', content: message });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Great, how can I assist?';
  }

  async addKnowledge(question: string, answer: string) {
    const embedding = await this.generateEmbedding(question + ' ' + answer);
    await this.prisma.knowledgeBase.create({
      data: {
        question,
        answer,
        embedding,
      },
    });

    // Also add to Pinecone
    await this.index.upsert([{
      id: `kb-${Date.now()}`,
      values: embedding,
      metadata: { question, answer },
    }]);
  }

  async processAiRequest(data: { question: string }) {
    const answer = await this.answerFaq(data.question, []);
    return answer;
  }

  // Get or create booking draft for customer
  private async getOrCreateDraft(customerId: string): Promise<any> {
    let draft = await this.prisma.bookingDraft.findUnique({
      where: { customerId }
    });

    if (!draft) {
      draft = await this.prisma.bookingDraft.create({
        data: {
          customerId,
          step: 'service',
          version: 1
        }
      });
    }

    return draft;
  }

  // Update draft
  private async updateDraft(customerId: string, updates: Partial<any>): Promise<any> {
    return this.prisma.bookingDraft.upsert({
      where: { customerId },
      update: {
        ...updates,
        version: { increment: 1 },
        updatedAt: new Date()
      },
      create: {
        customerId,
        step: 'service',
        version: 1,
        ...updates
      }
    });
  }

  // Complete booking from draft
  private async completeBooking(draft: any, customerId: string, bookingsService: any): Promise<any> {
    const dateTime = new Date(`${draft.date} ${draft.time}`); // Simple parse, improve as needed

    // Check availability
    const availability = await bookingsService.checkAvailability(dateTime, draft.service);
    if (!availability.available) {
      throw new Error('The requested time slot is not available. Please choose another time.');
    }

    const bookingData = {
      customerId,
      service: draft.service!,
      dateTime,
      status: 'confirmed'
    };

    const booking = await bookingsService.createBooking(bookingData);
    await this.prisma.bookingDraft.delete({ where: { customerId } });
    return booking;
  }

  // Classify intent
  private async classifyIntent(message: string, history: { role: 'user' | 'assistant'; content: string }[] = [], hasDraft: boolean = false): Promise<'faq' | 'booking' | 'other'> {
    // If draft exists, always continue booking flow
    if (hasDraft) {
      return 'booking';
    }

    const messages: any[] = [
      { role: 'system', content: `Classify the user intent as "faq" (general question about salon/services), "booking" (wants to book, provide details, confirm/cancel appointment), or "other". Return ONLY: {"intent": "faq" | "booking" | "other"}

Strong rules:
- If message contains booking-related words (book, appointment, schedule, service, date, time, name), classify as "booking"
- If message is a question about salon/services/pricing/hours, classify as "faq"
- If message is short responses like dates ("tomorrow", "next Friday", "9 AM", "John"), classify as "booking"
- Otherwise "other"` }
    ];

    messages.push(...history.slice(-3).map(h => ({ role: h.role, content: h.content })));
    messages.push({ role: 'user', content: message });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 50,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content?.trim();
    try {
      const parsed = JSON.parse(content || '{}');
      return parsed.intent || 'other';
    } catch {
      return 'other';
    }
  }

  // Unified conversation handler
  async handleConversation(
    message: string,
    customerId: string,
    history: { role: 'user' | 'assistant'; content: string }[] = [],
    bookingsService: any
  ): Promise<{ response: string; updatedHistory: { role: 'user' | 'assistant'; content: string }[]; draft?: any }> {
    // Check if draft exists without creating
    const existingDraft = await this.prisma.bookingDraft.findUnique({
      where: { customerId }
    });
    const hasDraft = !!existingDraft;

    let intent: 'faq' | 'booking' | 'other';
    if (hasDraft) {
      intent = 'booking';
    } else {
      intent = await this.classifyIntent(message, history.slice(-3), false);
    }

    let response: string;
    let updatedHistory = [...history, { role: 'user' as const, content: message }];
    let draft: any = undefined;

    if (intent === 'faq') {
      response = await this.answerFaq(message, history.slice(-3));
    } else if (intent === 'booking') {
      draft = existingDraft || await this.getOrCreateDraft(customerId);

      const extraction = await this.extractBookingDetails(message, history.slice(-3));

      // Update draft based on extraction
      const updates: any = {};
      if (extraction.service) updates.service = extraction.service;
      if (extraction.date) updates.date = extraction.date;
      if (extraction.time) updates.time = extraction.time;
      if (extraction.name) updates.name = extraction.name;

      // Update step based on missing fields (order: service, date, time, name)
      const missing = [];
      if (!draft.service && !extraction.service) missing.push('service');
      if (!draft.date && !extraction.date) missing.push('date');
      if (!draft.time && !extraction.time) missing.push('time');
      if (!draft.name && !extraction.name) missing.push('name');

      if (missing.length > 0) {
        updates.step = missing[0]; // Next step is first missing
      } else {
        updates.step = 'confirm';
      }

      if (extraction.subIntent === 'confirm' && missing.length === 0) {
        try {
          // Complete booking
          await this.completeBooking(draft, customerId, bookingsService);
          response = `Wonderful! Your ${draft.service} appointment on ${draft.date} at ${draft.time} for ${draft.name} is confirmed. See you soon!`;
        } catch (error) {
          response = `I'm sorry, ${error.message} Would you like to choose a different time?`;
        }
        // Clear draft already done in completeBooking if successful
      } else if (extraction.subIntent === 'cancel') {
        await this.prisma.bookingDraft.delete({ where: { customerId } });
        response = `No problem, booking cancelled. How else can I help?`;
      } else {
        // Update draft
        const updatedDraft = await this.updateDraft(customerId, updates);
        draft = updatedDraft;

        response = await this.generateBookingResponse(message, draft, extraction);
      }
    } else {
      // Fallback general response - but if hasDraft, shouldn't reach here
      if (hasDraft) {
        // Fallback to booking if draft exists
        return this.handleConversation(message, customerId, history, bookingsService);
      }

      const bookings = await bookingsService.getBookings(customerId);
      const upcoming = bookings.bookings.filter((b: any) => new Date(b.dateTime) > new Date());
      const context = upcoming.length > 0
        ? `Upcoming: ${upcoming.map(b => `${b.service} on ${new Date(b.dateTime).toLocaleDateString()}`).join(', ')}`
        : 'No upcoming';

      const systemPrompt = `You are a warm salon receptionist. Respond helpfully to general queries. Context: ${context}. Keep it 1-2 sentences, friendly.`;

      const messages: any[] = [{ role: 'system', content: systemPrompt }];
      messages.push({ role: 'user', content: message });

      const openaiResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 150,
      });

      response = openaiResponse.choices[0].message.content || 'How can I help you today?';
    }

    updatedHistory.push({ role: 'assistant' as const, content: response });
    return { response, updatedHistory, draft };
  }



  async generateResponse(message: string, customerId: string, bookingsService: any, history?: any[], extractedBooking?: any, faqContext?: string): Promise<string> {
    const result = await this.handleConversation(message, customerId, history || [], bookingsService);
    return result.response;
  }

  async extractStepBasedBookingDetails(message: string, currentStep: string, history?: any[]): Promise<any> {
    return { nextStep: currentStep }; // Simplified; update callers
  }

  async generateStepBasedBookingResponse(message: string, customerId: string, bookingsService: any, history: any[] = [], draft: any, bookingResult: any): Promise<string> {
    const result = await this.handleConversation(message, customerId, history, bookingsService);
    return result.response;
  }

  async generateGeneralResponse(message: string, customerId: string, bookingsService: any, history?: any[]): Promise<string> {
    const result = await this.handleConversation(message, customerId, history || [], bookingsService);
    return result.response;
  }


}
