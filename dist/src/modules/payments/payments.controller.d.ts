import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    handleCallback(body: any): Promise<{
        ResultCode: number;
        ResultDesc: string;
    }>;
    getCallbackHealth(): {
        status: string;
        message: string;
    };
    testStkPush(body: {
        phone: string;
        amount: number;
    }): Promise<{
        checkoutRequestId: any;
        merchantRequestId: any;
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
}
