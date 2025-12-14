

import { Controller, Post, Body, Get, Logger, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('mpesa')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) { }

  @Get('status/:checkoutRequestId')
  async getPaymentStatus(@Param('checkoutRequestId') checkoutRequestId: string) {
    const payment = await this.paymentsService.getPaymentByCheckoutRequestId(checkoutRequestId);
    if (!payment) {
      return { status: 'not_found' };
    }
    return { status: payment.status, payment };
  }

  // === M-PESA CALLBACK URL ===
  @Post('callback')
  async handleCallback(@Body() body: any) {
    this.logger.log('📥 [CONTROLLER] M-Pesa callback received');
    this.logger.debug(`[CONTROLLER] Callback body keys: ${Object.keys(body).join(', ')}`);
    
    try {
      await this.paymentsService.handleCallback(body);
      this.logger.log('✅ [CONTROLLER] Callback processed successfully');
    } catch (error) {
      this.logger.error(`❌ [CONTROLLER] Error processing callback: ${error.message}`);
      this.logger.error(`[CONTROLLER] Error stack: ${error.stack}`);
    }

    // This response MUST be returned so M-Pesa stops re-sending callbacks
    // M-PESA expects this exact format
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

  @Post('webhook')
  async handleWebhook(@Body() body: { checkoutRequestId: string; status: string }) {
    this.logger.log('🔔 Payment webhook received:', JSON.stringify(body));

    if (!body.checkoutRequestId || !body.status) {
      return { status: 'error', message: 'Missing checkoutRequestId or status' };
    }

    await this.paymentsService.handlePaymentWebhook(body.checkoutRequestId, body.status);
    return { status: 'received' };
  }

}

