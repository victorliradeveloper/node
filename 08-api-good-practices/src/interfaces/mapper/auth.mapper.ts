import { RegisterRequestDto } from '../dto/request/register-request.dto';
import { LoginRequestDto } from '../dto/request/login-request.dto';

export class AuthMapper {
  static toRegisterInput(dto: RegisterRequestDto) {
    return { name: dto.name, email: dto.email, password: dto.password };
  }

  static toLoginInput(dto: LoginRequestDto) {
    return { email: dto.email, password: dto.password };
  }
}
