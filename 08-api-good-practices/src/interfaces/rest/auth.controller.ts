import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { AUTH_USE_CASE } from '../../domain/port/in/auth.use-case';
import type { AuthUseCase } from '../../domain/port/in/auth.use-case';
import { RegisterRequestDto } from '../dto/request/register-request.dto';
import { LoginRequestDto } from '../dto/request/login-request.dto';
import { AuthMapper } from '../mapper/auth.mapper';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_USE_CASE) private readonly authUseCase: AuthUseCase) {}

  @Post('register')
  register(@Body() dto: RegisterRequestDto) {
    const { name, email, password } = AuthMapper.toRegisterInput(dto);
    return this.authUseCase.register(name, email, password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginRequestDto) {
    const { email, password } = AuthMapper.toLoginInput(dto);
    return this.authUseCase.login(email, password);
  }
}
