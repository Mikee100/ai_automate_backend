  // === TEST STK PUSH ENDPOINT ===

import { Controller, Post, Body,Get, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('mpesa')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  // === M-PESA CALLBACK URL ===
  @Post('callback')
  async handleCallback(@Body() body: any) {
    this.logger.log('✅ M-Pesa callback received:', JSON.stringify(body));
    
    await this.paymentsService.handleCallback(body);

    // This response MUST be returned so M-Pesa stops re-sending callbacks
    return { 
      ResultCode: 0,
      ResultDesc: 'Accepted'
    };
  }
  // Optional: GET endpoint for health check/debugging
  @Get('callback')
  getCallbackHealth() {
    return { status: 'ok', message: 'M-Pesa callback endpoint is up. Use POST for callbacks.' };
  }

    @Post('test-stk-push')
  async testStkPush(@Body() body: { phone: string; amount: number }) {
    this.logger.log(`[TEST] STK Push requested for phone: ${body.phone}, amount: ${body.amount}`);
    try {
      const result = await this.paymentsService.testStkPush(body.phone, body.amount);
      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`[TEST] STK Push failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

}
