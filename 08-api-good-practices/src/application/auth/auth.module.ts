import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../../interfaces/rest/auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../../infrastructure/security/jwt.strategy';
import { UserRepositoryAdapter } from '../../infrastructure/persistence/adapter/user-repository.adapter';
import { AUTH_USE_CASE } from '../../domain/port/in/auth.use-case';
import { USER_REPOSITORY_PORT } from '../../domain/port/out/user-repository.port';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY_PORT, useClass: UserRepositoryAdapter },
    { provide: AUTH_USE_CASE, useClass: AuthService },
    JwtStrategy,
  ],
  exports: [JwtModule, USER_REPOSITORY_PORT],
})
export class AuthModule {}
