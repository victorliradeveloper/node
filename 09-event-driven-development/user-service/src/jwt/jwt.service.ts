import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class CustomJwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  sign(payload: { userId: string; name: string }, subject: string): string {
    return this.jwtService.sign(payload, {
      subject,
      issuer: 'user-service',
      expiresIn: '2h',
    });
  }
}
