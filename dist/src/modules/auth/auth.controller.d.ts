import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    }>;
    logout(): Promise<{
        message: string;
    }>;
    getProfile(): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
    }>;
}
