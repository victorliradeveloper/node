import { Module } from '@nestjs/common';
import { JwtModule } from '../jwt/jwt.module';
import { MessagingModule } from '../messaging/messaging.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule, JwtModule, MessagingModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
