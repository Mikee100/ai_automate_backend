import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(email: string, password: string) {
    // For demo purposes, accept any email/password combination
    // In a real app, you'd validate against a database
    if (email && password) {
      const payload = { email, sub: '1' };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: '1',
          email,
          name: 'Admin User',
          role: 'admin',
        },
      };
    }
    throw new Error('Invalid credentials');
  }

  async validateUser(payload: any) {
    // In a real app, you'd fetch the user from the database
    return { id: payload.sub, email: payload.email };
  }
}
